import { forwardRef, Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AccountModule } from "src/account/account.module";
import { NetworkModule } from "src/network/network.module";
import { TeleBotModule } from "src/telegram-bot/telebot.module";
import { TaskService } from "./task.service";

@Module({
  imports: [ScheduleModule.forRoot(), AccountModule, NetworkModule],
  providers: [TaskService],
  controllers: [],
  exports: [TaskService],
})
export class TaskModule {}
