export type CalendarSettings = {
  name: string;
  hidden: boolean;
  prefix: string;
  lastSyncedAt: string;
};
export type CalendarPreferences = Record<string, CalendarSettings>;
