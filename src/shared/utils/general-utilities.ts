import { DEF_TIMEZONE } from "../constants/system-constants";

export const getCurrentLocalTime = (timeZone?: string) =>
  new Date().toLocaleString(undefined, {
    timeZone: timeZone || DEF_TIMEZONE,
  });

export const delayMs = async (delayInMs: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, delayInMs);
  });
