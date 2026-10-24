import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { z as esmZod } from "zod";

const require = createRequire(import.meta.url);
const modules = [
  ["ESM", esmZod],
  ["CJS", require("zod").z],
];

for (const [entry, z] of modules) {
  for (const asynchronous of [false, true]) {
    for (const dirty of [false, true]) {
      test(`${entry}: ${
        asynchronous ? "async" : "sync"
      } arrays stop after a fully parsed ${
        dirty ? "dirty" : "invalid"
      } element`, async () => {
        let visited = 0;
        const inspect = (value) => {
          visited++;
          return value;
        };
        const element = z
          .any()
          .transform(asynchronous ? async (value) => inspect(value) : inspect)
          .pipe(
            z.object({
              team: dirty ? z.number().min(1) : z.number(),
              notes: dirty ? z.string().min(1) : z.string(),
            })
          );
        const bad = dirty ? { team: 0, notes: "" } : { team: "bad", notes: 42 };
        const input = [
          { team: 1884, notes: "valid prefix" },
          ...Array(20_000).fill(bad),
        ];
        const schema = z.array(element);
        const result = asynchronous
          ? await schema.safeParseAsync(input)
          : schema.safeParse(input);
        assert.equal(result.success, false);
        assert.equal(
          result.error.issues.length,
          2,
          "retain both first-element issues without aggregating the remaining invalid records"
        );
        assert.deepEqual(
          result.error.issues.map((issue) => issue.path),
          [
            [1, "team"],
            [1, "notes"],
          ]
        );
        assert.equal(
          visited,
          2,
          "later elements must not execute after failure"
        );
      });
    }
  }

  test(`${entry}: valid record unions, transformations, nested arrays and fallback alternatives survive`, async () => {
    const record = z
      .object({
        type: z.literal("objective"),
        record: z.object({ team: z.number(), scores: z.array(z.number()) }),
      })
      .or(
        z.object({
          type: z.literal("pit"),
          record: z.object({
            team: z.number(),
            notes: z.string().transform((s) => s.trim()),
          }),
        })
      );
    const schema = z.array(record);
    const input = [
      { type: "pit", record: { team: 1884, notes: "  ready  " } },
      { type: "objective", record: { team: 1884, scores: [2, 3, 4] } },
    ];
    const expected = [
      { type: "pit", record: { team: 1884, notes: "ready" } },
      input[1],
    ];
    assert.deepEqual(schema.parse(input), expected);
    assert.deepEqual(await schema.parseAsync(input), expected);
    assert.equal(schema.element, record);
    assert.equal(record.options[0].shape.type.value, "objective");
    // An unsuccessful first union alternative must not reject a valid later one.
    const alternative = z
      .array(z.string().min(4))
      .or(z.array(z.string().transform((s) => s.toUpperCase())));
    assert.deepEqual(alternative.parse(["ok", "yes"]), ["OK", "YES"]);
    assert.deepEqual(await alternative.parseAsync(["ok", "yes"]), [
      "OK",
      "YES",
    ]);
    const asyncTransform = z.array(
      z.array(z.number().transform(async (n) => n * 2))
    );
    assert.deepEqual(await asyncTransform.parseAsync([[1, 2], [], [3]]), [
      [2, 4],
      [],
      [6],
    ]);
    assert.deepEqual(schema.parse([]), []);
  });

  test(`${entry}: known length violations reject before child refinements`, async () => {
    let visited = 0;
    const child = z.number().superRefine(() => {
      visited++;
    });
    const cases = [
      [z.array(child).max(2), [1, 2, 3], "too_big"],
      [z.array(child).min(3), [1, 2], "too_small"],
      [z.array(child).length(2), [1, 2, 3], "too_big"],
      [z.array(child).length(2), [1], "too_small"],
    ];
    for (const [schema, input, code] of cases) {
      for (const asynchronous of [false, true]) {
        const result = asynchronous
          ? await schema.safeParseAsync(input)
          : schema.safeParse(input);
        assert.equal(result.success, false);
        assert.equal(result.error.issues[0].code, code);
        assert.equal(
          visited,
          0,
          "a length-invalid array must not execute child refinements"
        );
      }
    }
  });
}
