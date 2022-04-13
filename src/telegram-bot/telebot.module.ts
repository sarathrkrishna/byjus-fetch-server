import { forwardRef, Module } from "@nestjs/common";
import { AccountModule } from "src/account/account.module";
import { AccountUserMasterModule } from "src/account_user_master/account.user.master.module";
import { JsonEncModule } from "src/json-enc/jsonenc.module";
import { TaskModule } from "src/tasks/task.module";
import { UserModule } from "src/user/user.module";
import { TeleBotController } from "./telebot.controller";
import { TeleBotService } from "./telebot.services";

@Module({
  imports: [UserModule, AccountModule, AccountUserMasterModule, JsonEncModule],
  providers: [TeleBotService],
  exports: [TeleBotService],
  controllers: [TeleBotController],
})
export class TeleBotModule {}
