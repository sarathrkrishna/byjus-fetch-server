import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Account, AccountDocument } from "./account.schema";
import { ObjectId } from "src/shared/dtos/mongo.dto";
import { NetworkService } from "src/network/network.service";

@Injectable()
export class AccountService {
  private accounts: Account[] = [];
  private logger = new Logger(AccountService.name);

  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    private readonly networkService: NetworkService
  ) {}

  fetchAllAccounts(): Promise<Account[]> {
    return this.accountModel.find().exec();
  }

  async updateAccounts(accounts: Account[]) {
    for (const account of accounts) {
      await this.updateOneAccount(account._id, account);
    }
  }

  updateOneAccount(accountId: ObjectId, updateData: Account) {
    return this.accountModel
      .findOneAndUpdate({ _id: accountId }, updateData)
      .exec();
  }

  getAllFetchEnabledAccounts(): Promise<Account[]> {
    return this.accountModel.find({ fetchEnabled: true }).exec();
  }

  findAccounts(doc: Account) {
    return this.accountModel.find(doc).exec();
  }
  createMultipleAccounts(doc: Account[]) {
    return this.accountModel.create(doc);
  }

  fetchLocalAccounts() {
    return this.accounts;
  }

  findLocalAccountById(id: ObjectId) {
    return this.fetchLocalAccounts().find(
      (la) => String(la._id) === String(id)
    );
  }

  deleteOneAccount(doc: Account) {
    return this.accountModel.deleteOne(doc);
  }

  // to sync db account data to local
  async syncDbAccountsToLocal() {
    const enabledAccounts = await this.fetchAllAccounts();

    if (!enabledAccounts.length) {
      throw new Error(
        "Database contains no account data, or all accounts are disabled"
      );
    }

    this.accounts = enabledAccounts;
  }

  // sync local data to db
  syncLocalAccountsToDb(accIds: ObjectId[] = [], exempt: ObjectId[] = []) {
    let accounts: Account[] = [];

    if (accIds.length) {
      accounts = this.accounts.filter(
        (acc) => accIds.findIndex((id) => id === acc._id) !== -1
      );
    } else {
      // if acc not provided, then all local accounts are selected
      accounts = this.accounts;
    }

    const whiteListedAccounts = accounts.filter(
      (acc) => !exempt.find((e) => e === acc._id)
    );

    return this.updateAccounts(whiteListedAccounts);
  }

  // update local accounts
  updateLocalAccounts(accounts: Account[], upsert = false) {
    this.accounts = [
      ...this.accounts.filter(
        (acc) => !accounts.find((ac) => ac._id === acc._id)
      ),
      ...accounts
        .map((acc) => {
          let account = this.accounts.find((a) => a._id === acc._id);
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

  // login some/all users - local and db sync
  async loginAccountsAndSyncToDb(
    accIds: ObjectId[] = [],
    exempt: ObjectId[] = []
  ) {
    let accounts: Account[] = [];

    if (accIds.length) {
      accounts = this.accounts.filter(
        (acc) => accIds.findIndex((id) => id === acc._id) !== -1
      );
    } else {
      // if acc not provided, then all local accounts are selected
      accounts = this.accounts;
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
        const { token } = (await this.networkService.loginAccount(
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

  async disableTillAccountSyncToDb(
    accId: ObjectId,
    disableTill: number,
    disableReason: string,
    upSync = true
  ) {
    const account = this.accounts.find((acc) => acc._id === accId);

    account.disableTill = disableTill;
    account.disableReason = disableReason;

    this.updateLocalAccounts([account]);

    if (upSync) {
      await this.syncLocalAccountsToDb([accId]);
    }
  }
}
