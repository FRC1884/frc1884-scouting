import { TBAMatch } from "@griffins-scout/api";
import got from "got";

import { env } from "./env.js";

const firstBaseUrl = "https://frc-api.firstinspires.org/v3.0";

export const getPracticeMatches = async () => {
  const eventCode = env.FIRST_EVENT_CODE;

  const res = await got(
    `${firstBaseUrl}/${env.SEASON}/schedule/${eventCode}?tournamentLevel=practice`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${env.FIRST_AUTH_USER}:${env.FIRST_AUTH_PW}`
        ).toString("base64")}`,
      },
    }
  ).json<FirstMatchResult>();

  const match = res.Schedule;

  return match.map(convertToTBAMatch);
};

interface FirstMatchResult {
  Schedule: FirstMatch[];
}

interface FirstMatch {
  description: string;
  startTime: string;
  matchNumber: number;
  field: Field;
  tournamentLevel: TournamentLevel;
  teams: Team[];
}

enum Field {
  Primary = "Primary",
}

interface Team {
  teamNumber: number;
  station: Station;
  surrogate: boolean;
}

type Station = "Blue1" | "Blue2" | "Blue3" | "Red1" | "Red2" | "Red3";

type TournamentLevel = "Qualification" | "Practice" | "Playoff";

function convertToTBAMatch(match: FirstMatch): TBAMatch {
  const blueTeams = match.teams.filter((team) => team.station.includes("Blue"));

  const blueAlliance: TBAMatch["alliances"]["blue"] = {
    score: 0,
    dq_team_keys: [],
    surrogate_team_keys: blueTeams
      .filter((team) => team.surrogate)
      .map((team) => `frc${team.teamNumber}`),
    team_keys: blueTeams
      .filter((team) => !team.surrogate)
      .map((team) => `frc${team.teamNumber}`),
  };

  const redTeams = match.teams.filter((team) => team.station.includes("Red"));

  const redAlliance: TBAMatch["alliances"]["red"] = {
    score: 0,
    dq_team_keys: [],
    surrogate_team_keys: redTeams
      .filter((team) => team.surrogate)
      .map((team) => `frc${team.teamNumber}`),
    team_keys: redTeams
      .filter((team) => !team.surrogate)
      .map((team) => `frc${team.teamNumber}`),
  };

  return {
    alliances: {
      blue: blueAlliance,
      red: redAlliance,
    },
    comp_level:
      match.tournamentLevel === "Qualification"
        ? "qm"
        : match.tournamentLevel === "Practice"
          ? "pm"
          : "sf",
    event_key: env.EVENT_CODE,
    key: `${env.EVENT_CODE}${match.tournamentLevel}${match.matchNumber}`,
    match_number: match.matchNumber,

    predicted_time: Date.parse(match.startTime),
    set_number: 1,
    time: Date.parse(match.startTime),

    videos: [],
    winning_alliance: "",

    post_result_time: null,
    score_breakdown: null,
    actual_time: null,
  };
}
