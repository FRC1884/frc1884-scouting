import dotenv from "dotenv";
import { envsafe, str, url } from "envsafe";

dotenv.config();

export const env = envsafe({
  NODE_ENV: str({
    devDefault: "development",
    choices: ["development", "test", "production"],
  }),
  CONTROLLER_URL: url(),
  QA_SHEET_ID: str(),
  MAIN_SHEET_ID: str(),
  CRED_PATH: str(),
});
