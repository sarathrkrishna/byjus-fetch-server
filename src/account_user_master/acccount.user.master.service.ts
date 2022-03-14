import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
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

  createMultipleAccountUserMasters(doc: AccountUserMaster[]) {
    return this.accountUserMasterModel.create(doc);
  }
}
