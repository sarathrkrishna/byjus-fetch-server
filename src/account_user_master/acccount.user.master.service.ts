import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ObjectId } from "mongoose";
import {
  AccountUserMaster,
  AccountUserMasterDocument,
} from "./account.user.master.schema";

@Injectable()
export class AccountUserMasterService {
  constructor(
    @InjectModel(AccountUserMaster.name)
    private accountUserMasterModel: Model<AccountUserMasterDocument>
  ) {}

  findAccountUserMasters(doc: AccountUserMaster) {
    return this.accountUserMasterModel.find(doc).exec();
  }

  findAccountUserMastersNotUser(accountId: ObjectId, noUserId: ObjectId) {
    return this.accountUserMasterModel.find({
      accountId,
      userId: { $ne: noUserId },
    });
  }

  createMultipleAccountUserMasters(doc: AccountUserMaster[]) {
    return this.accountUserMasterModel.create(doc);
  }

  deleteOneAccountUserMaster(doc: AccountUserMaster) {
    return this.accountUserMasterModel.deleteOne(doc);
  }

  deleteManyAccountUserMaster(doc: AccountUserMaster) {
    return this.accountUserMasterModel.deleteMany(doc);
  }
}
