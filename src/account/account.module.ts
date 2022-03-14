import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { NetworkModule } from "src/network/network.module";
import { Account, AccountSchema } from "./account.schema";
import { AccountService } from "./account.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    NetworkModule,
  ],
  providers: [AccountService],
  controllers: [],
  exports: [AccountService],
})
export class AccountModule {}
