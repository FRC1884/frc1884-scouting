import { PitRecord, pitRecordSchema } from "@griffins-scout/game";
import { z } from "zod";
import { requireRole } from "../utils/auth.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

export const pitRouter = router({
  findAll: publicProcedure.query(async ({ ctx: { db } }) => {
    return db.pitRecord.findMany() as unknown as {
      id: string;
      content: PitRecord;
    }[];
  }),

  create: publicProcedure
    .input(pitRecordSchema)
    .mutation(async ({ input, ctx: { db } }) => {
      await db.pitRecord.create({
        data: { content: input },
      });
    }),

  createMany: publicProcedure
    .input(z.array(pitRecordSchema))
    .mutation(async ({ input, ctx: { db } }) => {
      await db.pitRecord.createMany({
        data: {
          content: input,
        },
      });
    }),

  deleteOne: publicProcedure
    .input(z.string().cuid())
    .mutation(async ({ input, ctx: { db } }) => {
      await db.pitRecord.delete({ where: { id: input } });
    }),

  deleteAll: publicProcedure.mutation(async ({ ctx: { db } }) => {
    await db.pitRecord.deleteMany({});
  }),

  findByTeam: publicProcedure
    .input(
      z.object({
        teamNumber: z.number().int().gte(0),
      })
    )
    .query(async ({ input, ctx: { db } }) => {
      const records = (await db.pitRecord.findMany()) as unknown as {
        id: string;
        content: PitRecord;
      }[];

      return records.filter((r) => r.content.info.teamNumber === input.teamNumber);
    }),

  updateOne: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        record: pitRecordSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireRole(ctx, ["ADMIN", "EDITOR"]);
      await ctx.db.pitRecord.update({
        where: { id: input.id },
        data: { content: input.record },
      });
    }),
});
