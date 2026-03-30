import {
  ObjectiveRecord,
  objectiveInfoSchema,
  objectiveRecordSchema,
} from "@griffins-scout/game";
import { z } from "zod";
import { requireRole } from "../utils/auth.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

export const objectiveRouter = router({
  findAll: publicProcedure.query(async ({ ctx: { db } }) => {
    return db.objectiveRecord.findMany() as unknown as {
      id: string;
      content: ObjectiveRecord;
    }[];
  }),

  create: publicProcedure
    .input(objectiveRecordSchema)
    .mutation(async ({ input, ctx: { db } }) => {
      await db.objectiveRecord.create({
        data: { content: input },
      });
    }),

  createMany: publicProcedure
    .input(z.array(objectiveRecordSchema))
    .mutation(async ({ input, ctx: { db } }) => {
      await db.objectiveRecord.createMany({
        data: {
          content: input,
        },
      });
    }),

  deleteOne: publicProcedure
    .input(z.string().cuid())
    .mutation(async ({ input, ctx: { db } }) => {
      await db.objectiveRecord.delete({ where: { id: input } });
    }),

  deleteAll: publicProcedure.mutation(async ({ ctx: { db } }) => {
    await db.objectiveRecord.deleteMany({});
  }),

  findByMatch: publicProcedure
    .input(
      z.object({
        matchNumber: objectiveInfoSchema.shape.matchNumber,
        matchType: objectiveInfoSchema.shape.matchType,
      })
    )
    .query(async ({ input, ctx: { db } }) => {
      const records = (await db.objectiveRecord.findMany({})) as unknown as {
        id: string;
        content: ObjectiveRecord;
      }[];

      return records.filter((r) => {
        return (
          r.content.info.matchNumber === input.matchNumber &&
          r.content.info.matchType === input.matchType
        );
      }) as unknown as { id: string; content: ObjectiveRecord }[];
    }),

  findByTeam: publicProcedure
    .input(
      z.object({
        teamNumber: objectiveInfoSchema.shape.teamNumber,
      })
    )
    .query(async ({ input, ctx: { db } }) => {
      const records = (await db.objectiveRecord.findMany({})) as unknown as {
        id: string;
        content: ObjectiveRecord;
      }[];

      return records.filter((r) => {
        return r.content.info.teamNumber === input.teamNumber;
      }) as unknown as { id: string; content: ObjectiveRecord }[];
    }),

  updateOne: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        record: objectiveRecordSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireRole(ctx, ["ADMIN", "EDITOR"]);
      await ctx.db.objectiveRecord.update({
        where: { id: input.id },
        data: { content: input.record },
      });
    }),
});
