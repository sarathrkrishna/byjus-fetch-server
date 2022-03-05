import { Injectable, Logger } from "@nestjs/common";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { ObjectId } from "mongoose";
import { Account } from "src/account/account.schema";
import { AccountService } from "src/account/account.service";
import { NetworkService } from "src/network/network.service";
import {
  FETCH_CYCLE_CRON_NAME,
  FETCH_CYCLE_CRON_TIME,
} from "src/shared/constants/code-constants";
import { getCurrentLocalTime } from "src/shared/utils/general-utilities";

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
        // display enabled users
        TaskService.accounts.forEach((acc, index) =>
          this.logger.log(`${index + 1}. ${acc.username} ${acc.fullName}`)
        );
      } catch (error) {
        this.logger.error(
          `Something went wrong while syncing db to local: ${error}`
        );
      }

      // login all accounts
      try {
        await this.loginAccountsAndSyncToDb();
      } catch (error) {
        this.logger.error(
          `Something went wrong while logging in and syncing: ${error}`
        );
      }
    }
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
  syncLocalAccountsToDb(exempt: ObjectId[] = []) {
    const whiteListedAccounts = TaskService.accounts.filter(
      (acc) => !exempt.find((e) => e === acc._id)
    );
    return this.accountService.updateAccounts(whiteListedAccounts);
  }

  // login all users
  async loginAccountsAndSyncToDb(exempt: ObjectId[] = []) {
    if (!TaskService.accounts.length) {
      throw new Error(`Accounts list is empty, unable to login`);
    }

    const whiteListedAccounts = TaskService.accounts.filter(
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
}
