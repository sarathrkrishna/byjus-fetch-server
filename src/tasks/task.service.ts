import { ConsoleLogger, Injectable, Logger } from "@nestjs/common";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { ObjectId } from "mongoose";
import { features } from "process";
import { Account } from "src/account/account.schema";
import { AccountService } from "src/account/account.service";
import { NetworkService } from "src/network/network.service";
import {
  FETCH_CYCLE_CRON_NAME,
  FETCH_CYCLE_CRON_TIME,
  DISABLED_REASONS,
  TOO_MUCH_REQUESTS_HALT_DELAY,
  QUESTION_FETCHED_HALT_DELAY,
  DISABLE_TILL_QUESTION_FETCHED_PERIOD,
} from "src/shared/constants/code-constants";
import {
  createAccountSpecificLog,
  delayMs,
  getCurrentLocalTime,
} from "src/shared/utils/general-utilities";
import { DoubtCheckDto, PostDto, QuestionFetchedDto } from "./dto/task.dto";

@Injectable()
export class TaskService {
  private logger = new Logger(TaskService.name);
  private fetchCycleCronJob: CronJob;
  private static accounts: Account[] = [];

  constructor(
    private readonly accountService: AccountService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly newtworkService: NetworkService
  ) {}

  @Cron(FETCH_CYCLE_CRON_TIME, {
    name: FETCH_CYCLE_CRON_NAME,
  })
  async handleTask() {
    this.fetchCycleCronJob = this.schedulerRegistry.getCronJob(
      FETCH_CYCLE_CRON_NAME
    );
    // execute
    const time = getCurrentLocalTime();
    this.logger.log(`Fetch running @ ${time}`);

    if (!TaskService.accounts.length) {
      // if local accounts list is not occupied
      this.logger.error(`Empty accounts list, executing accounts init...`);
      // fetch accounts from db
      try {
        await this.syncDbAccountsToLocal();
        // display downsynced users
        this.logger.log(
          `Down-synced accounts: \n ${TaskService.accounts
            .map((acc) => `${acc.username} ${acc.fullName}`)
            .join("  ")}`
        );
      } catch (error) {
        this.logger.error(
          `Something went wrong while syncing db to local: ${error}`
        );
      }
    }

    // if accounts exists in local
    const whiteListedAccounts = TaskService.accounts.filter(
      (acc) => acc.disableTill === 0 && acc.fetchEnabled
    );

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
              await this.disableTillAccountSyncToDb(
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
              await this.disableTillAccountSyncToDb(
                acc._id,
                -1,
                DISABLED_REASONS.TOKEN_EXPIRE_RELOGIN_HALT,
                false // dont want to sync to db
              );
              await this.loginAccountsAndSyncToDb([acc._id]);
              await this.disableTillAccountSyncToDb(
                acc._id,
                0,
                DISABLED_REASONS.NONE,
                false // dont want to sync to db
              );
            },
            async () => {
              // tooMuchRequestsHandler
              this.logger.error(
                createAccountSpecificLog(
                  acc,
                  "Too much requests, disabled for 1 Hr."
                )
              );

              await this.disableTillAccountSyncToDb(
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
              await this.disableTillAccountSyncToDb(
                acc._id,
                -1,
                DISABLED_REASONS.TOKEN_INVALID_RELOGIN_HALT,
                false // dont want to sync to db
              );
              await this.loginAccountsAndSyncToDb([acc._id]);
              await this.disableTillAccountSyncToDb(
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

    const questionDatas = await Promise.all(
      fetcheableDoubts.map(async (fetcheable) => {
        const account = TaskService.accounts.find(
          (acc) => acc._id === fetcheable.accountId
        );

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

          // disable account for 3 Hrs
          await this.disableTillAccountSyncToDb(
            fetcheable.accountId,
            questionFetched.postData.reduce(
              // return the furthest disable time from the available posts
              (acc, post) =>
                acc < post.can_answer_till ? post.can_answer_till : acc,
              0
            ),
            fetcheable.status === "already_fetched"
              ? DISABLED_REASONS.QUESTION_FETCHED_ALREADY
              : DISABLED_REASONS.QUESTION_FETCHED_HALT
          );

          return questionFetched;
        } else {
          this.logger.debug(
            createAccountSpecificLog(account, `Empty post. Rebounding.`)
          );

          await this.disableTillAccountSyncToDb(
            fetcheable.accountId,
            0,
            DISABLED_REASONS.NONE,
            false // dont want to sync to db
          );

          return undefined;
        }
      })
    );

    questionDatas
      .filter((qd) => qd)
      .map(async (qd) => {
        console.log(qd);
      });
  }

  // to sync db account data to local
  async syncDbAccountsToLocal() {
    const enabledAccounts =
      await this.accountService.getAllFetchEnabledAccounts();

    if (!enabledAccounts.length) {
      throw new Error("Database contains no account data");
    }

    TaskService.accounts = enabledAccounts;
  }

  // sync local data to db
  syncLocalAccountsToDb(accIds: ObjectId[] = [], exempt: ObjectId[] = []) {
    let accounts: Account[] = [];

    if (accIds.length) {
      accounts = TaskService.accounts.filter(
        (acc) => accIds.findIndex((id) => id === acc._id) !== -1
      );
    } else {
      // if acc not provided, then all local accounts are selected
      accounts = TaskService.accounts;
    }

    const whiteListedAccounts = accounts.filter(
      (acc) => !exempt.find((e) => e === acc._id)
    );
    return this.accountService.updateAccounts(whiteListedAccounts);
  }

  // login some/all users - local and db sync
  async loginAccountsAndSyncToDb(
    accIds: ObjectId[] = [],
    exempt: ObjectId[] = []
  ) {
    let accounts: Account[] = [];

    if (accIds.length) {
      accounts = TaskService.accounts.filter(
        (acc) => accIds.findIndex((id) => id === acc._id) !== -1
      );
    } else {
      // if acc not provided, then all local accounts are selected
      accounts = TaskService.accounts;
    }

    if (!accounts.length) {
      throw new Error(`Accounts list is empty, unable to login`);
    }

    const whiteListedAccounts = accounts.filter(
      (acc) => !exempt.find((e) => e === acc._id)
    );

    const loggedInAccounts = [];

    for (const acc of whiteListedAccounts) {
      try {
        const { token } = (await this.newtworkService.loginAccount(
          acc.username,
          acc.password
        )) as { username: string; token: string };
        acc.lastLogin = new Date().getTime();
        acc.token = token;

        loggedInAccounts.push(acc);
      } catch (error) {
        this.logger.error(
          `Something went wrong while logging in [${acc.username} ${acc.fullName}]: ${error}`
        );
      }
    }
    // update local and sync to db
    this.updateLocalAccounts(loggedInAccounts, false);
    await this.syncLocalAccountsToDb();
  }

  // update local accounts
  updateLocalAccounts(accounts: any[], upsert = false) {
    TaskService.accounts = [
      ...TaskService.accounts.filter(
        (acc) => !accounts.find((ac) => ac._id === acc._id)
      ),
      ...accounts
        .map((acc) => {
          let account = TaskService.accounts.find((a) => a._id === acc._id);
          if (!account) {
            if (upsert) {
              account = new Account();
            } else {
              return;
            }
          }
          for (let key in acc) {
            account[key] = acc[key];
          }
          return account;
        })
        .filter((acc) => acc),
    ] as Account[];
  }

  async disableTillAccountSyncToDb(
    accId: ObjectId,
    disableTill: number | null,
    disableReason: string,
    upSync = true
  ) {
    const account = TaskService.accounts.find((acc) => acc._id === accId);
    if (disableTill) {
      account.disableTill = disableTill;
    }
    account.disableReason = disableReason;

    this.updateLocalAccounts([account]);

    if (upSync) {
      await this.syncLocalAccountsToDb([accId]);
    }
  }
}
