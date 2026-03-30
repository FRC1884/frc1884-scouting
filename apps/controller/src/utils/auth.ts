import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { TRPCError } from "@trpc/server";

const KEY_LENGTH = 64;

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
};

export const verifyPassword = (password: string, passwordHash: string) => {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) return false;

  const derived = scryptSync(password, salt, KEY_LENGTH);
  const stored = Buffer.from(storedHash, "hex");
  if (derived.length !== stored.length) return false;

  return timingSafeEqual(derived, stored);
};

export const createSessionToken = () => randomBytes(32).toString("hex");

export const hashSessionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const requireUser = <
  TContext extends { user: { id: string; role: "ADMIN" | "EDITOR" | "SCOUT" } | null },
>(
  ctx: TContext
) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action.",
    });
  }

  return ctx.user;
};

export const requireRole = <
  TContext extends { user: { id: string; role: "ADMIN" | "EDITOR" | "SCOUT" } | null },
>(
  ctx: TContext,
  allowedRoles: Array<"ADMIN" | "EDITOR" | "SCOUT">
) => {
  const user = requireUser(ctx);
  if (!allowedRoles.includes(user.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }

  return user;
};
