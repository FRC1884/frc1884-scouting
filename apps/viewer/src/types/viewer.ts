import type { RouterOutput } from '../api';

export type ViewerPage = 'home' | 'browser' | 'performance' | 'account';
export type ObjectiveRecord = RouterOutput['objective']['findAll'][number];
export type PitRecord = RouterOutput['pit']['findAll'][number];
export type MatchRecord = RouterOutput['blueAlliance']['findAllClean'][number];
export type MatchType = ObjectiveRecord['content']['info']['matchType'];

export interface PageLink {
  label: string;
  value: ViewerPage;
}

export interface PageCard {
  kicker: string;
  label: string;
  value: ViewerPage;
  description: string;
  disabled: boolean;
}

export interface ViewerStat {
  label: string;
  value: number;
  caption: string;
}
