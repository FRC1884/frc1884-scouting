import { PitRecord, pitRecordSchema } from "@griffins-scout/game";
import { z } from "zod";
import { MAX_BATCH, publicProcedure, router } from "../trpc.js";

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
    .input(z.array(pitRecordSchema).max(MAX_BATCH))
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
});
