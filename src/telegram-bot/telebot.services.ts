import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import { ObjectId } from "src/shared/dtos/mongo.dto";
import { AccountService } from "src/account/account.service";
import { AccountUserMasterService } from "src/account_user_master/acccount.user.master.service";
import { ConfigDto } from "src/config/config.dto";
import {
  DISABLED_REASONS,
  TELE_BOT_BASE_URL,
  TELE_NOTIFY_CODES,
} from "src/shared/constants/code-constants";
import { QuestionFetchedDto } from "src/tasks/dto/task.dto";
import { TaskService } from "src/tasks/task.service";
import { User } from "src/user/user.schema";
import { UserService } from "src/user/user.service";
import { Update } from "./dtos/telebot.dto";
import {
  aUserDisabledEnabledAnAccountText,
  cannotEnableDueToTooMuchRequestError,
  chatIdUpdatedMessageText,
  enableDisableAccoutText,
  errorNotifyText,
  helpText,
  infoNotifyText,
  listAccountsText,
  newUserSubscribeText,
  noAccountsToList,
  nonExecutionText,
  qidNotFoundErrorText,
  questionMetaText,
  restartAccountText,
  tooMuchRequestsError,
  unknownNickname,
  unknownUser,
  unrecognizedCommandText,
  unrecognizedSlashCommand,
  userAlreadySubscribedText,
  warnNotifyText,
} from "./texts/telebot.texts";

@Injectable()
export class TeleBotService {
  private teleAxiosClient: AxiosInstance = axios.create({
    baseURL:
      TELE_BOT_BASE_URL + `bot${this.configService.get("tel_bot_token")}/`,
    headers: {
      ["Content-Type"]: "application/json",
    },
  });

  constructor(
    private readonly configService: ConfigService<ConfigDto>,
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly accountUserMasterService: AccountUserMasterService
  ) {}

  sendMessageToUser(chatId: string, text = "", parseAsHtml = true) {
    return this.teleAxiosClient.post("/sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: parseAsHtml ? "HTML" : undefined,
    });
  }

  getUpdates(params: {
    offset?: number;
    limit?: number;
    allowed_updates?: string[];
  }) {
    return this.teleAxiosClient.get("/getUpdates", {
      params,
    });
  }

  async postUpdateTelegramMessage(teleToken: string, body: Update) {
    console.log("chatId:", body.message.chat.id);
    try {
      const {
        message: {
          text,
          date,
          from: { first_name: firstName, last_name: lastName, username },
          chat: { id: chatId },
        },
      } = body;

      if (text.match(/^\/start$/gi)) {
        // /start
        // chat initiation
        const [user] = await this.userService.findUser({
          chatId: chatId.toString(),
        });

        if (user) {
          await this.sendMessageToUser(
            chatId.toString(),
            userAlreadySubscribedText(user.fullName)
          );
          return;
        }

        await this.sendMessageToUser(chatId.toString(), newUserSubscribeText);
      } else if (text.match(/^\/help$/gi)) {
        // /help
        await this.sendMessageToUser(chatId.toString(), helpText);
      } else if (text.match(/^\/(\d{5})\/(subscribe|unsubscribe)$/gi)) {
        // /qid/subscribe|unsubscribe
        // /qid/subscribe
        // /qid/unsubscribe

        const [, qid, subscState] = text.match(
          /^\/(\d{5})\/(subscribe|unsubscribe)$/i
        );

        const [user] = await this.userService.findUser({
          qid,
        });

        if (user) {
          // change the user's chatId
          await this.userService.updateUser({
            _id: user._id,
            chatId: subscState === "subscribe" ? chatId.toString() : "",
          });
          await this.sendMessageToUser(
            chatId.toString(),
            chatIdUpdatedMessageText(user.fullName, subscState === "subscribe")
          );
        } else {
          // render error
          await this.sendMessageToUser(chatId.toString(), qidNotFoundErrorText);
        }
      } else if (text.match(/^\/.+$/g)) {
        // for all slash commands
        // for all cases where the user is subscribed

        if (!this.accountService.getExecutionStatus()) {
          await this.sendMessageToUser(chatId.toString(), nonExecutionText);
          return false;
        }

        const [user] = await this.userService.findUser({
          chatId: chatId.toString(),
        });

        if (!user) {
          await this.sendMessageToUser(chatId.toString(), unknownUser);
          return;
        }

        const accUsrMstrList =
          await this.accountUserMasterService.findAccountUserMasters({
            userId: user._id,
          });

        const localAccounts = accUsrMstrList
          .map((aum) => this.accountService.findLocalAccountById(aum.accountId))
          .filter((v) => !!v);

        if (text.match(/^\/la$/gi)) {
          // /la
          if (!localAccounts.length) {
            await this.sendMessageToUser(chatId.toString(), noAccountsToList);
            return false;
          }

          await this.sendMessageToUser(
            chatId.toString(),
            listAccountsText(localAccounts)
          );
        } else if (text.match(/^\/(ea|da)$/gi)) {
          // /(ea|da) - enable all, disable all
          const [, state] = text.match(/^\/(ea|da)$/i) as [null, "ea" | "da"];

          const userConnectedAccounts =
            await this.userService.fetchUserAccounts(user._id);

          for (const acc of userConnectedAccounts) {
            // const aums =
            //   await this.accountUserMasterService.findAccountUserMastersNotUser(
            //     acc._id,
            //     user._id
            //   );
            // for (const aum of aums) {
            // const [user] = (await this.userService.findUser({
            //   _id: aum.userId,
            // })) as User[];

            // await this.sendMessageToUser(
            //   user.chatId,
            //   aUserDisabledEnabledAnAccountText(
            //     user.fullName,
            //     acc.nickName,
            //     state
            //   )
            // );
            // }

            if (
              (state === "ea" && acc.fetchEnabled) ||
              (state === "da" && !acc.fetchEnabled)
            ) {
              return;
            }

            const aums =
              await this.accountUserMasterService.findAccountUserMasters({
                accountId: acc._id,
              });

            for (const aum of aums) {
              const [user1] = (await this.userService.findUser({
                _id: aum.userId,
              })) as User[];

              await this.sendMessageToUser(
                user1.chatId,
                aUserDisabledEnabledAnAccountText(
                  user1.fullName === user.fullName ? "You" : user1.fullName,
                  acc.nickName,
                  state
                )
              );
            }

            switch (state) {
              case "ea":
                await this.accountService.updateOneAccount(acc._id, {
                  fetchEnabled: true,
                });
                break;
              case "da":
                await this.accountService.updateOneAccount(acc._id, {
                  fetchEnabled: false,
                });
                break;
            }

            await this.accountService.syncDbAccountsToLocal();
          }
        } else if (text.match(/^\/([a-zA-Z]+)\/(enable|disable|restart)$/gi)) {
          // /nick-name/enable|disable
          const [, nickName, fetchState] = text.match(
            /^\/([a-zA-Z]+)\/(enable|disable|restart)$/i
          );

          const account = localAccounts.find((lc) => lc.nickName === nickName);
          if (!account) {
            await this.sendMessageToUser(chatId.toString(), unknownNickname);
            return false;
          }
          if (fetchState === "restart") {
            // check if the account was disabled due to too much request error. In that case, unabling is not possible
            if (account.disableReason === DISABLED_REASONS.TOO_MUCH_REQUESTS) {
              await this.sendMessageToUser(
                chatId.toString(),
                cannotEnableDueToTooMuchRequestError
              );
            } else {
              this.accountService.updateLocalAccounts([
                {
                  _id: account._id,
                  disableTill: 0,
                  disableReason: DISABLED_REASONS.NONE,
                },
              ]);

              await this.accountService.syncLocalAccountsToDb([account._id]);

              await this.sendMessageToUser(
                chatId.toString(),
                restartAccountText(account.nickName)
              );
            }
          } else {
            this.accountService.updateLocalAccounts([
              {
                _id: account._id,
                fetchEnabled: (() => {
                  switch (fetchState) {
                    case "enable":
                      return true;
                    case "disable":
                      return false;
                  }
                })(),
              },
            ]);
            await this.accountService.syncLocalAccountsToDb([account._id]);

            await this.sendMessageToUser(
              chatId.toString(),
              enableDisableAccoutText(fetchState, account.nickName)
            );
          }
        } else {
          await this.sendMessageToUser(
            chatId.toString(),
            unrecognizedSlashCommand
          );
        }
      } else {
        await this.sendMessageToUser(
          chatId.toString(),
          unrecognizedCommandText
        );
      }
      return true;
    } catch (error) {
      console.log("SERVER ERROR", error);
    }
  }

  async informQuestionAvailability(questionData: QuestionFetchedDto) {
    const { accountId, postData } = questionData;
    const account = this.accountService.findLocalAccountById(accountId);

    const accUsrMstrList =
      await this.accountUserMasterService.findAccountUserMasters({
        accountId: account._id,
      });

    const users = (await Promise.all(
      accUsrMstrList.map(
        async (aum) =>
          (
            await this.userService.findUser({
              _id: aum.userId,
            })
          )[0]
      )
    )) as User[];

    for (const user of users) {
      for (const post of postData) {
        await this.notifyTelegram(
          questionMetaText(post),
          TELE_NOTIFY_CODES.INFO,
          user.chatId,
          account.nickName
        );
        await this.sendMessageToUser(user.chatId, post.description, false);
      }
    }
  }

  async informToomuchRequestsError(accountId: ObjectId) {
    const account = this.accountService.findLocalAccountById(accountId);

    const accUsrMstrList =
      await this.accountUserMasterService.findAccountUserMasters({
        accountId: account._id,
      });

    const users = (await Promise.all(
      accUsrMstrList.map(
        async (aum) =>
          (
            await this.userService.findUser({
              _id: aum.userId,
            })
          )[0]
      )
    )) as User[];

    for (const user of users) {
      await this.notifyTelegram(
        tooMuchRequestsError,
        TELE_NOTIFY_CODES.ERROR,
        user.chatId,
        account.nickName
      );
    }
  }

  notifyTelegram(text: string, code: string, chatId: string, nickName: string) {
    switch (code) {
      case TELE_NOTIFY_CODES.ERROR:
        return this.sendMessageToUser(chatId, errorNotifyText(text, nickName));
      case TELE_NOTIFY_CODES.INFO:
        return this.sendMessageToUser(chatId, infoNotifyText(text, nickName));
      case TELE_NOTIFY_CODES.WARN:
        return this.sendMessageToUser(chatId, warnNotifyText(text, nickName));
    }
  }
}
