import { stat } from "fs";
import { Account } from "src/account/account.schema";

export const userAlreadySubscribedText = (fullName: string) => `
You are already subscribed as ${fullName}.
For other commands, type <b>/help</b>
`;

export const newUserSubscribeText = `
Welcome user. It seems this chat has not subscribed to me yet. Hence, you can type the following command to start a subscription with me.
<pre>/qid/subscribe</pre> 
Please replace the <i>qid</i> with the one that's assigned to you.
`;

export const helpText = `
<b>/qid/subscribe</b> To subscribe to the chat bot.
<b>/qid/unsubscribe</b> To unsubscribe from the chat bot.
<b>/la</b> To list all connected accounts
`;

export const qidNotFoundErrorText = `
It seems the qid you provided does not match to any users. Please try again.
`;

export const chatIdUpdatedMessageText = (
  fullName: string,
  subscribe = true
) => `
Hello ${fullName}. You are ${
  subscribe
    ? "successfully subscribed."
    : "unsubscribed. Unless you subscribe again, you will not recieve any notifications from the bot."
}
`;

export const listAccountsText = (accs: Account[]) => `
Accounts to which you are linked:
<pre>${accs
  .map(
    (acc) =>
      `${acc.nickName} | ${acc.fullName} | ${
        acc.disableTill === 0 ? "Running" : `Stopped (${acc.disableReason})`
      } | ${acc.fetchEnabled ? "Enabled" : "Disabled"}\n`
  )
  .join("\n")} </pre>
`;

export const enableDisableAccoutText = (state: string, nickName: string) =>
  `Account <b>${nickName}</b> has been ${state}d by you.`;

export const restartAccountText = (nickName: string) =>
  `Account <b>${nickName}</b> has been restarted by you.`;

export const cannotEnableDueToTooMuchRequestError = `
Cannot restart the account as the account was disabled due to too much requests error.
`;

export const errorNotifyText = (text: string, nickName: string) => `
<b>[ERROR]: ${nickName}</b>
${text}.
`;
export const infoNotifyText = (text: string, nickName: string) => `
<b>[INFO]: ${nickName}</b>
${text}.
`;

export const warnNotifyText = (text: string, nickName: string) => `
<b>[WARN]: ${nickName}</b>
${text}.
`;
