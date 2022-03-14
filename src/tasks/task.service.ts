import { Injectable, Logger } from "@nestjs/common";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { AccountService } from "src/account/account.service";
import { NetworkService } from "src/network/network.service";
import {
  FETCH_CYCLE_CRON_NAME,
  FETCH_CYCLE_CRON_TIME,
  DISABLED_REASONS,
  TOO_MUCH_REQUESTS_HALT_DELAY,
  QUESTION_FETCHED_HALT_DELAY,
  TELE_NOTIFY_CODES,
} from "src/shared/constants/code-constants";
import {
  createAccountSpecificLog,
  delayMs,
  getCurrentLocalTime,
} from "src/shared/utils/general-utilities";
import { TeleBotService } from "src/telegram-bot/telebot.services";
import { DoubtCheckDto, PostDto, QuestionFetchedDto } from "./dto/task.dto";

@Injectable()
export class TaskService {
  private logger = new Logger(TaskService.name);
  private fetchCycleCronJob: CronJob;
  private static execute: boolean = true;

  constructor(
    private readonly accountService: AccountService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly newtworkService: NetworkService,
    private readonly telebotService: TeleBotService
  ) {}

  @Cron(FETCH_CYCLE_CRON_TIME, {
    name: FETCH_CYCLE_CRON_NAME,
  })
  async handleTask() {
    if (!TaskService.execute) {
      this.logger.log(`No execution. Running empty cron.`);
      return;
    }

    this.fetchCycleCronJob = this.schedulerRegistry.getCronJob(
      FETCH_CYCLE_CRON_NAME
    );
    // execute
    const time = getCurrentLocalTime();
    this.logger.log(`Fetch running @ ${time}`);

    if (!this.accountService.fetchLocalAccounts().length) {
      // if local accounts list is not occupied
      this.logger.error(`Empty accounts list, executing accounts init...`);
      // fetch accounts from db
      try {
        await this.accountService.syncDbAccountsToLocal();
        // display downsynced users
        this.logger.log(
          `Down-synced accounts: \n ${this.accountService
            .fetchLocalAccounts()
            .map((acc) => `${acc.username} ${acc.fullName}`)
            .join("  ")}`
        );
      } catch (error) {
        this.logger.error(
          `Something went wrong while syncing db to local: ${error.message}`
        );
      }
    }

    const whiteListedAccounts = (
      await Promise.all(
        this.accountService.fetchLocalAccounts().map(async (acc) => {
          if (acc.fetchEnabled) {
            if (acc.disableTill === 0) {
              return acc;
            } else if (acc.disableTill === -1) {
              return null;
            } else if (acc.disableTill < new Date().getTime()) {
              // enable account by setting disableTill = 0
              this.logger.debug(createAccountSpecificLog(acc, "Enabling user"));
              await this.accountService.disableTillAccountSyncToDb(
                acc._id,
                0,
                DISABLED_REASONS.NONE
              );

              return acc;
            } else {
              return null;
            }
          } else {
            return null;
          }
        })
      )
    ).filter((acc) => !!acc);

    this.logger.log(
      `Enabled accounts:\n ${whiteListedAccounts
        .map((acc) => `${acc.username} ${acc.fullName}`)
        .join("  ")}`
    );

    // try doubt check

    const doubtCheckResults = (
      await Promise.all(
        whiteListedAccounts.map((acc) => {
          return this.newtworkService.handleCheckDoubt(
            acc.token,
            async (postId) => {
              //doubtFetchedHandler
              this.logger.debug(
                createAccountSpecificLog(
                  acc,
                  "Possible Doubt availability, proceeding."
                )
              );
              // halt till the cross check finishes
              await this.accountService.disableTillAccountSyncToDb(
                acc._id,
                -1,
                DISABLED_REASONS.DOUBT_FETCHED_TEMP_HALT,
                false
              );

              const doubtCheckResult: DoubtCheckDto = {
                postId,
                status: "available",
                accountId: acc._id,
                token: acc.token,
              };

              return doubtCheckResult;
            },
            () => {
              // noDoubtsHandler
              this.logger.debug(
                createAccountSpecificLog(
                  acc,
                  "No doubts available, Rebounding."
                )
              );
            },
            () => {
              // alreadyFetchedHandler
              this.logger.debug(
                createAccountSpecificLog(
                  acc,
                  "Question already fetched, proceeding."
                )
              );

              const doubtCheckResult: DoubtCheckDto = {
                status: "already_fetched",
                accountId: acc._id,
                token: acc.token,
              };

              return doubtCheckResult;
            },
            async () => {
              // tokenExpiredHandler
              this.logger.error(
                createAccountSpecificLog(
                  acc,
                  "Token expired, logging in again."
                )
              );
              await this.accountService.disableTillAccountSyncToDb(
                acc._id,
                -1,
                DISABLED_REASONS.TOKEN_EXPIRE_RELOGIN_HALT,
                false // dont want to sync to db
              );
              await this.accountService.loginAccountsAndSyncToDb([acc._id]);
              await this.accountService.disableTillAccountSyncToDb(
                acc._id,
                0,
                DISABLED_REASONS.NONE,
                false // dont want to sync to db
              );
            },
            async () => {
              // tooMuchRequestsHandler
              const errorTxt = "Too much requests, disabled for 1 Hr.";
              this.logger.error(createAccountSpecificLog(acc, errorTxt));

              await this.telebotService.informToomuchRequestsError(acc._id);

              await this.accountService.disableTillAccountSyncToDb(
                acc._id,
                new Date().getTime() + TOO_MUCH_REQUESTS_HALT_DELAY,
                DISABLED_REASONS.TOO_MUCH_REQUESTS
              );

              const doubtCheckResult: DoubtCheckDto = {
                status: "too_much_requests",
                accountId: acc._id,
                token: acc.token,
              };

              return doubtCheckResult;
            },
            async () => {
              // invalidTockenHandler
              this.logger.error(
                createAccountSpecificLog(acc, "Invalid token, loggin in again.")
              );
              await this.accountService.disableTillAccountSyncToDb(
                acc._id,
                -1,
                DISABLED_REASONS.TOKEN_INVALID_RELOGIN_HALT,
                false // dont want to sync to db
              );
              await this.accountService.loginAccountsAndSyncToDb([acc._id]);
              await this.accountService.disableTillAccountSyncToDb(
                acc._id,
                0,
                DISABLED_REASONS.NONE,
                false // dont want to sync to db
              );
            },
            (error) => {
              // unknownErrorHandler
              this.logger.error(createAccountSpecificLog(acc, error.message));
            }
          );
        })
      )
    ).filter((db) => db);

    if (!doubtCheckResults.length) {
      return;
    }

    const fetcheableDoubts = doubtCheckResults.filter(
      (dcr) => dcr.status === "available" || dcr.status === "already_fetched"
    );

    const questionDatas = (
      await Promise.all(
        fetcheableDoubts.map(async (fetcheable) => {
          const account = this.accountService
            .fetchLocalAccounts()
            .find((acc) => acc._id === fetcheable.accountId);

          if (fetcheable.status !== "already_fetched") {
            // wait for 5 seconds and then fetch
            await delayMs(QUESTION_FETCHED_HALT_DELAY);
          }

          const { posts, meta } = (
            await this.newtworkService.getDoubtPost(fetcheable.token)
          ).data as {
            posts: PostDto[];
            meta: {
              current_page: number;
              total_pages: number;
              total_count: number;
            };
          };

          if (posts.length) {
            this.logger.debug(
              createAccountSpecificLog(
                account,
                `Question available, solve, submit and enable fetch.`
              )
            );

            const questionFetched: QuestionFetchedDto = {
              postData: posts.map((post) => ({
                id: post.id,
                description: post.description,
                subject_name: post.subject_name,
                grade: post.grade,
                total_points: post.total_points,
                created_at: post.created_at,
                updated_at: post.updated_at,
                subject_expert_name: post.subject_expert_name,
                can_answer_till: post.can_answer_till,
              })),
              accountId: fetcheable.accountId,
            };

            const maxCanAnswerTill = questionFetched.postData.reduce(
              // return the furthest disable time from the available posts
              (acc, post) =>
                acc < post.can_answer_till ? post.can_answer_till : acc,
              0
            );

            // disable account for 2 Hrs
            try {
              await this.accountService.disableTillAccountSyncToDb(
                fetcheable.accountId,
                parseInt(String(maxCanAnswerTill) + "000"),
                fetcheable.status === "already_fetched"
                  ? DISABLED_REASONS.QUESTION_FETCHED_ALREADY
                  : DISABLED_REASONS.QUESTION_FETCHED_HALT
              );
            } catch (error) {
              console.log("error at disable til");
            }

            return questionFetched;
          } else {
            this.logger.debug(
              createAccountSpecificLog(account, `Empty post. Rebounding.`)
            );

            await this.accountService.disableTillAccountSyncToDb(
              fetcheable.accountId,
              0,
              DISABLED_REASONS.NONE,
              false // dont want to sync to db
            );

            return undefined;
          }
        })
      )
    ).filter((v) => !!v);

    for (const qd of questionDatas) {
      await this.telebotService.informQuestionAvailability(qd);
    }
  }
}
