// Run with Node 24's --test after building the controller and provisioning the
// four Prisma tables in an empty frc_security_fixture_* PostgreSQL database.
// This test deliberately never provisions, clears, or drops database objects.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

function fixtureDatabaseUrl() {
  let url;
  try {
    url = new URL(process.env.DATABASE_URL ?? "");
    const database = decodeURIComponent(url.pathname.slice(1));
    assert.ok(["postgres:", "postgresql:"].includes(url.protocol));
    assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname));
    assert.ok(/^frc_security_fixture_[a-zA-Z0-9_]+$/.test(database));
    // Reject libpq host/database/schema overrides and URL fragments.
    assert.ok(!url.search && !url.hash);
  } catch {
    throw new Error(
      "DATABASE_URL must explicitly name a loopback PostgreSQL frc_security_fixture_* database without query parameters"
    );
  }
  url.searchParams.set("schema", "public");
  url.searchParams.set("connection_limit", "2");
  url.searchParams.set("connect_timeout", "5");
  url.searchParams.set("pool_timeout", "5");
  url.searchParams.set("socket_timeout", "10");
  return url.href;
}

async function unusedPort() {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise((resolve, reject) =>
    reservation.close((error) => (error ? reject(error) : resolve()))
  );
  return port;
}

async function databaseCall(operation) {
  try {
    return await operation();
  } catch {
    // Prisma failures can contain connection details. Never forward them.
    throw new Error("Disposable fixture database operation failed");
  }
}

async function stop(child, exited) {
  if (child.exitCode !== null || child.signalCode !== null) {
    await exited;
    return;
  }
  child.kill("SIGTERM");
  const stopped = await Promise.race([
    exited.then(() => true),
    delay(5000).then(() => false),
  ]);
  if (!stopped) {
    child.kill("SIGKILL");
    await exited;
  }
}

test(
  "HTTP uploads reject an invalid batch atomically and retain valid nested records",
  {
    timeout: 90000,
  },
  async (t) => {
    const databaseUrl = fixtureDatabaseUrl();
    const require = createRequire(import.meta.url);
    const { PrismaClient } = require("@prisma/client");
    const {
      objectiveRecordDefault,
      pitRecordDefault,
      objectiveRecordSchema,
    } = require("@griffins-scout/game");
    const superjson = require("superjson");
    const db = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
      errorFormat: "minimal",
      log: [],
    });
    let child;
    let exited;
    let directory;
    try {
      const counts = () =>
        databaseCall(() =>
          Promise.all([
            db.objectiveRecord.count(),
            db.pitRecord.count(),
            db.subjectiveRecord.count(),
            db.tBARecord.count(),
          ])
        );
      assert.ok(
        (await counts()).every((count) => count === 0),
        "All four fixture tables must be empty before the test"
      );

      const objective = structuredClone(objectiveRecordDefault);
      const pit = structuredClone(pitRecordDefault);
      objective.info.teamNumber = 1884;
      objective.info.matchNumber = 7;
      objective.other.scoutNameOne = "Fixture Scout";
      pit.info.teamNumber = 1884;
      pit.other.scoutNameOne = "Fixture Pit Scout";
      objective.teleop.offensiveCycles.push({
        ...objectiveRecordSchema.shape.teleop.shape.offensiveCycles.element.parse(
          {}
        ),
        scoringArea: "Speaker",
        pickupToLossOfPossesstionTime: 3.5,
      });
      const objectiveEntry = { type: "objective", record: objective };
      const invalidBody = superjson.stringify([
        objectiveEntry,
        ...Array(4096).fill(0),
      ]);
      assert.ok(
        Buffer.byteLength(invalidBody) < 100 * 1024,
        "Invalid batch must reach validation below the HTTP JSON body limit"
      );

      const port = await unusedPort();
      directory = await mkdtemp(join(tmpdir(), "frc-security-http-"));
      child = spawn(
        process.execPath,
        [fileURLToPath(new URL("../dist/src/server.js", import.meta.url))],
        {
          cwd: directory,
          env: {
            NODE_ENV: "test",
            HOST: "127.0.0.1",
            PORT: String(port),
            DATABASE_URL: databaseUrl,
            ...(process.env.PATH ? { PATH: process.env.PATH } : {}),
          },
          stdio: ["ignore", "pipe", "pipe"],
        }
      );
      // Drain rather than print application/Prisma diagnostics or credentials.
      child.stdout.resume();
      child.stderr.resume();
      let spawnFailed = false;
      child.on("error", () => {
        spawnFailed = true;
      });
      exited = new Promise((resolve) => child.once("close", resolve));
      const origin = `http://127.0.0.1:${port}`;
      const request = (path, options = {}) =>
        fetch(origin + path, {
          ...options,
          redirect: "error",
          signal: AbortSignal.timeout(10000),
        });
      const deadline = Date.now() + 20000;
      let ready = false;
      while (Date.now() < deadline) {
        assert.ok(
          !spawnFailed && child.exitCode === null && child.signalCode === null,
          "Fixture controller exited before becoming ready; raw logs suppressed"
        );
        try {
          const response = await request("/healthz");
          await response.arrayBuffer();
          ready = response.status === 200;
          if (ready) break;
        } catch {
          /* Startup connection refusals are expected. */
        }
        await delay(100);
      }
      assert.ok(ready, "Fixture controller did not become healthy");

      async function envelope(response) {
        const reader = response.body.getReader();
        const chunks = [];
        let bytes = 0;
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            assert.ok(
              bytes <= 16 * 1024,
              "HTTP response must remain bounded to 16 KiB"
            );
            chunks.push(Buffer.from(value));
          }
        } finally {
          await reader.cancel().catch(() => {});
        }
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
      }
      const upload = (body) =>
        request("/trpc/record.createRecord", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
      const invalid = await upload(invalidBody);
      assert.equal(
        invalid.status,
        400,
        "Invalid upload must return BAD_REQUEST"
      );
      const rejection = superjson.deserialize((await envelope(invalid)).error);
      assert.equal(rejection.data.code, "BAD_REQUEST");
      const issues = JSON.parse(rejection.message);
      assert.ok(
        Array.isArray(issues) && issues.length === 1,
        "Validation must report only the first failed array element"
      );
      function firstFailedElement(issue) {
        assert.ok(
          Array.isArray(issue.path) && issue.path[0] === 1,
          "Every reported issue must belong to the first failed element"
        );
        for (const branch of issue.unionErrors ?? []) {
          for (const nested of branch.issues ?? []) firstFailedElement(nested);
        }
      }
      issues.forEach(firstFailedElement);
      assert.ok(
        (await counts()).every((count) => count === 0),
        "Rejected batch must not persist even its valid prefix"
      );
      const health = await request("/healthz");
      assert.equal(
        health.status,
        200,
        "Controller must survive invalid upload"
      );
      await health.arrayBuffer();
      t.diagnostic(
        "Invalid batch: HTTP 400, bounded first-element error, no rows, health 200"
      );

      async function read(path) {
        const response = await request(`/trpc/${path}`);
        assert.equal(response.status, 200, "Read RPC must succeed");
        return superjson.deserialize((await envelope(response)).result.data);
      }
      assert.ok(
        (await read("objective.findAll")).length === 0,
        "Read RPC must still work after rejected upload"
      );
      const valid = await upload(
        superjson.stringify([objectiveEntry, { type: "pit", record: pit }])
      );
      assert.equal(valid.status, 200, "Valid mixed upload must succeed");
      await envelope(valid);
      assert.ok(
        (await counts()).every((count, index) => count === (index < 2 ? 1 : 0)),
        "Valid upload must create exactly one objective and one pit row"
      );
      for (const [path, model, expected] of [
        ["objective.findAll", db.objectiveRecord, objective],
        ["pit.findAll", db.pitRecord, pit],
      ]) {
        const rows = await read(path);
        const stored = await databaseCall(() => model.findMany());
        assert.ok(
          rows.length === 1 && stored.length === 1,
          "HTTP and direct database reads must each return one row"
        );
        assert.deepEqual(rows[0].content, expected);
        assert.deepEqual(stored[0].content, expected);
        assert.equal(rows[0].id, stored[0].id);
      }
      t.diagnostic(
        "Valid nested objective and pit: HTTP 200, exact one-row persistence and readback"
      );
    } finally {
      try {
        if (child) await stop(child, exited);
      } finally {
        try {
          await databaseCall(() => db.$disconnect());
        } finally {
          if (directory) await rm(directory, { recursive: true, force: true });
        }
      }
    }
  }
);
