import { logInfo, logInfoWithHeading } from "@griffins-scout/logger";
import { PrismaClient, UserRole } from "@prisma/client";
import * as trpc from "@trpc/server";
import { hashSessionToken } from "./utils/auth.js";

const extractBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
};

export const createContext = async ({
  req,
}: {
  req: {
    headers: {
      authorization?: string;
    };
  };
}) => {
  const db = new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
      "info",
      "warn",
      "error",
    ],
  });

  db.$on("query", (e: any) => {
    logInfoWithHeading("Query", e.query);
    logInfo("Duration: " + e.duration + "ms");
  });

  const token = extractBearerToken(req.headers.authorization);
  const session = token
    ? await db.session.findUnique({
        where: {
          tokenHash: hashSessionToken(token),
        },
        include: {
          user: true,
        },
      })
    : null;

  return {
    db,
    sessionToken: token,
    user: session
      ? {
          id: session.user.id,
          username: session.user.username,
          role: session.user.role as UserRole,
        }
      : null,
  };
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
