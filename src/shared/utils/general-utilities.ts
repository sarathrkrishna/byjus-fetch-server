import { Account } from "src/account/account.schema";
import { DEF_TIMEZONE } from "../constants/system-constants";
import * as mongoose from "mongoose";

export const getCurrentLocalTime = (timeZone?: string) =>
  new Date().toLocaleString(undefined, {
    timeZone: timeZone || DEF_TIMEZONE,
  });

export const getLocalTimeFromByjusStamp = (stamp: number) =>
  new Date(+(String(stamp) + "000"));

export const delayMs = async (delayInMs: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, delayInMs);
  });

export const createAccountSpecificLog = (acc: Account, log: string) =>
  `[${acc.username} ${acc.fullName}] ${log}`;

export const createObjectId = (id: string) => new mongoose.Types.ObjectId(id);
