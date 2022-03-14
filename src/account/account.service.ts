import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Account, AccountDocument } from "./account.schema";
import { ObjectId } from "src/shared/dtos/mongo.dto";

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>
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
}
