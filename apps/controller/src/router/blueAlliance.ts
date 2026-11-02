import { z } from "zod";
import { TBAMatch } from "../server.js";

import { MAX_BATCH, publicProcedure, router } from "../trpc.js";
// import {
//   compLevelToMatchType,
//   getMatches,
//   getTeam,
//   matchToMatchLevel,
//   teamKeyToNumber,
// } from "../utils/blueAlliance.js";
//

export const blueAllianceRouter = router({
  findAll: publicProcedure.query(async ({ ctx: { db } }) => {
    // return await getMatches();
    return (await db.tBARecord.findMany()) as unknown as {
      content: TBAMatch;
      id: string;
    }[];
  }),

  importFromTba: publicProcedure
    .input(z.array(z.any()).max(MAX_BATCH))
    .mutation(async ({ input, ctx: { db } }) => {
      await db.tBARecord.createMany({
        data: input.map((match) => ({
          content: match,
        })),
      });
    }),

  findAllClean: publicProcedure.query(async ({ ctx: { db } }) => {
    return (await db.tBARecord.findMany())
      .map((record: { content: unknown }) => record.content as TBAMatch)
      .map((m: TBAMatch) => ({
        key: m.key,
        comp_level: m.comp_level,
        match_number: m.match_number,
        set_number: m.set_number,
      }));
  }),

  deleteAll: publicProcedure.mutation(async ({ ctx: { db } }) => {
    await db.tBARecord.deleteMany();
  }),
});
