import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AccountUserMasterService } from "./acccount.user.master.service";
import {
  AccountUserMaster,
  AccountUserMasterSchema,
} from "./account.user.master.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccountUserMaster.name, schema: AccountUserMasterSchema },
    ]),
  ],
  providers: [AccountUserMasterService],
  exports: [AccountUserMasterService],
})
export class AccountUserMasterModule {}
