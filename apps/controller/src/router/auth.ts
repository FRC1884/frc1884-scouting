import { UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  requireUser,
  requireRole,
  verifyPassword,
} from "../utils/auth.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

const roleSchema = z.enum(["ADMIN", "EDITOR", "SCOUT"]);

const credentialsSchema = z.object({
  username: z.string().trim().min(3).max(32),
  password: z.string().min(8).max(128),
});

export const authRouter = router({
  bootstrapStatus: publicProcedure.query(async ({ ctx: { db } }) => {
    const userCount = await db.user.count();

    return {
      requiresSetup: userCount === 0,
    };
  }),

  bootstrapAdmin: publicProcedure
    .input(credentialsSchema)
    .mutation(async ({ input, ctx: { db } }) => {
      const userCount = await db.user.count();
      if (userCount > 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Initial admin setup has already been completed.",
        });
      }

      const user = await db.user.create({
        data: {
          username: input.username,
          passwordHash: hashPassword(input.password),
          role: UserRole.ADMIN,
        },
      });

      const token = createSessionToken();
      await db.session.create({
        data: {
          tokenHash: hashSessionToken(token),
          userId: user.id,
        },
      });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
    }),

  login: publicProcedure
    .input(credentialsSchema)
    .mutation(async ({ input, ctx: { db } }) => {
      const user = await db.user.findUnique({
        where: {
          username: input.username,
        },
      });

      if (!user || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password.",
        });
      }

      const token = createSessionToken();
      await db.session.create({
        data: {
          tokenHash: hashSessionToken(token),
          userId: user.id,
        },
      });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
    }),

  logout: protectedProcedure.mutation(async ({ ctx: { db, sessionToken } }) => {
    if (sessionToken) {
      await db.session.deleteMany({
        where: {
          tokenHash: hashSessionToken(sessionToken),
        },
      });
    }

    return {
      ok: true,
    };
  }),

  me: publicProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
    };
  }),

  listUsers: protectedProcedure.query(async ({ ctx }) => {
    requireRole(ctx, ["ADMIN"]);

    const users = await ctx.db.user.findMany({
      orderBy: {
        username: "asc",
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return users;
  }),

  createUser: protectedProcedure
    .input(
      credentialsSchema.extend({
        role: roleSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireRole(ctx, ["ADMIN"]);

      const existing = await ctx.db.user.findUnique({
        where: {
          username: input.username,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with that username already exists.",
        });
      }

      const user = await ctx.db.user.create({
        data: {
          username: input.username,
          passwordHash: hashPassword(input.password),
          role: input.role,
        },
      });

      return {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      };
    }),

  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        role: roleSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const actingUser = requireRole(ctx, ["ADMIN"]);

      const targetUser = await ctx.db.user.findUnique({
        where: {
          id: input.userId,
        },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      if (targetUser.id === actingUser.id && input.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot remove your own admin role.",
        });
      }

      return ctx.db.user.update({
        where: {
          id: input.userId,
        },
        data: {
          role: input.role,
        },
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
        },
      });
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        username: z.string().trim().min(3).max(32),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const authenticatedUser = requireUser(ctx);

      const existing = await ctx.db.user.findFirst({
        where: {
          username: input.username,
          NOT: {
            id: authenticatedUser.id,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with that username already exists.",
        });
      }

      const user = await ctx.db.user.update({
        where: {
          id: authenticatedUser.id,
        },
        data: {
          username: input.username,
        },
        select: {
          id: true,
          username: true,
          role: true,
        },
      });

      return { user };
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(8).max(128),
        newPassword: z.string().min(8).max(128),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const authenticatedUser = requireUser(ctx);

      const user = await ctx.db.user.findUnique({
        where: {
          id: authenticatedUser.id,
        },
      });

      if (!user || !verifyPassword(input.currentPassword, user.passwordHash)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect.",
        });
      }

      await ctx.db.user.update({
        where: {
          id: authenticatedUser.id,
        },
        data: {
          passwordHash: hashPassword(input.newPassword),
        },
      });

      return { ok: true };
    }),
});
