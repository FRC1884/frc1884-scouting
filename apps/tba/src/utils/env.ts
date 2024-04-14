import { logInfo } from "@griffins-scout/logger";
import dotenv from "dotenv";
import { bool, envsafe, num, str, url } from "envsafe";

dotenv.config();

export const env = envsafe({
  NODE_ENV: str({
    devDefault: "development",
    choices: ["development", "test", "production"],
  }),
  X_TBA_AUTH_KEY: str(),
  EVENT_CODE: str(),
  CONTROLLER_URL: url(),
  FIRST_AUTH_USER: str(),
  FIRST_AUTH_PW: str(),
  FIRST_EVENT_CODE: str(),
  SEASON: num(),
  PRACTICE_MODE: bool(),
});

logInfo(`Event: ${env.EVENT_CODE}`);
