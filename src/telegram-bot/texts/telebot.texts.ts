import { stat } from "fs";
import { Account } from "src/account/account.schema";
import { getLocalTimeFromByjusStamp } from "src/shared/utils/general-utilities";
import { PostDto } from "src/tasks/dto/task.dto";

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
* <b>/qid/subscribe</b> To subscribe to the chat bot.
* <b>/qid/unsubscribe</b> To unsubscribe from the chat bot.
* <b>/la</b> To list all connected accounts
* <b>/nickname/(enable|disable)</b> To enable or disable an account.
* <b>/nickname/restart</b> To restart an account after solving doubts.
* <b>/ea</b> To enable all connected accounts.
* <b>/da</b> To disable all connected accounts.
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
Accounts to which you are linked:\n
<pre>${accs
  .map(
    (acc) =>
      `${acc.nickName} | ${acc.fullName} | ${
        acc.disableTill === 0
          ? acc.fetchEnabled
            ? "Running"
            : "Runnable"
          : `Stopped (${acc.disableReason}) [${getLocalTimeFromByjusStamp(
              acc.disableTill
            )}]`
      } | ${acc.fetchEnabled ? "Enabled" : "Disabled"}`
  )
  .join("\n\n")} </pre>
`;

export const enableDisableAccoutText = (state: string, nickName: string) =>
  `Account <b>${nickName}</b> has been ${state}d by you.`;

export const restartAccountText = (nickName: string) =>
  `Account <b>${nickName}</b> has been restarted by you.`;

export const cannotRestartDueToTooMuchRequestError = `
Cannot restart the account as the account was disabled due to too much requests error.
`;
export const cannotRestartAlreadyRestarted = `
Cannot restart the account as the account is already running.
`;
export const alreadyInTheRequestedState = `
The account is already in the requested state.
`;

export const errorNotifyText = (text: string, nickName: string) => `
<b>[ERROR]: ${nickName}</b>
${text}
`;
export const infoNotifyText = (text: string, nickName: string) => `
<b>[INFO]: ${nickName}</b>
${text}
`;

export const warnNotifyText = (text: string, nickName: string) => `
<b>[WARN]: ${nickName}</b>
${text}
`;

export const questionMetaText = (post: PostDto) => `
Question Id: ${post.id}
Subject: ${post.subject_name}
Points: ${post.total_points}
Available Till: ${getLocalTimeFromByjusStamp(post.can_answer_till)}
`;

export const tooMuchRequestsError = `Too much requests, disabled for 1 Hr.`;

export const unrecognizedCommandText = `Unclear, come again?`;
export const unrecognizedSlashCommand = `Command not recognized, Try again`;
export const unknownNickname = `Unknown nickname, please recheck`;
export const noAccountsToList = `No accounts to list now, please try after sometime`;
export const unknownUser = `Unknown user, please subscribe if you are a user to Byjus Fetch Engine`;

export const aUserDisabledEnabledAnAccountText = (
  fullName: string,
  accNickname: string,
  state: "ea" | "da" | "enable" | "disable"
) =>
  `${
    state === "ea" || state === "enable"
      ? `${fullName} enabled the account ${accNickname}. You can disable the account if you like by typing <pre>/${accNickname}/disable</pre>`
      : `${fullName} disabled the account ${accNickname}. You can enable the account if you like by typing <pre>/${accNickname}/enable</pre>`
  }`;

export const nonExecutionText = `Currenty the server is in non execution mode. Contact the support.`;
