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

  async fetchAllAccounts(): Promise<Account[]> {
    return await this.accountModel.find().exec();
  }

  async updateAccountCollection() {}

  async updateOneAccount(accountId: ObjectId, updateData: Account) {
    return await this.accountModel
      .findOneAndUpdate({ _id: accountId }, updateData)
      .exec();
  }
}
