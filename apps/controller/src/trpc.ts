import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError, type core } from "zod";
import { Context } from "./context";
import { logErrorWithHeading, logInfo, logInfoWithHeading } from "@griffins-scout/logger";

const t = initTRPC.context<Context>().create({
  // Optional:
  transformer: superjson,
  // Optional:
  errorFormatter({ shape, error }) {
    // The stack repeats the unbounded Zod message, so validation errors drop it.
    const { stack, ...data } = shape.data;
    return {
      ...shape,
      message: boundedMessage(error),
      data: error.cause instanceof ZodError ? data : shape.data,
    };
  },
});

// Zod reports every failed array element; keep one issue so responses and logs stay bounded.
function boundedMessage(error: TRPCError): string {
  return error.cause instanceof ZodError && error.cause.issues.length
    ? JSON.stringify([firstIssue(error.cause.issues[0])], null, 2)
    : error.message;
}

// Keeps only the first nested issue of each union branch.
function firstIssue(issue: core.$ZodIssue): core.$ZodIssue {
  if (issue.code !== "invalid_union") return issue;
  const errors = issue.errors.map((branch) => branch.slice(0, 1).map(firstIssue));
  return { ...issue, errors } as core.$ZodIssue;
}

// Zod rejects longer input arrays before validating any element.
export const MAX_BATCH = 1000;

const logger = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;
  result.ok
    ? logInfoWithHeading(`${type} ${path}`, `OK request timing: ${durationMs}ms`,)
    : logErrorWithHeading(`${type} ${path}`, `Error request timing: ${durationMs}ms ${result.error.name}: ${boundedMessage(result.error)}`)

  return result;
});

export const router = t.router;
export const mergeRouters = t.mergeRouters;
export const publicProcedure = t.procedure.use(logger);
