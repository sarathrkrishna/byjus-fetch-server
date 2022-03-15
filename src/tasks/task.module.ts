import { forwardRef, Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AccountModule } from "src/account/account.module";
import { NetworkModule } from "src/network/network.module";
import { TeleBotModule } from "src/telegram-bot/telebot.module";
import { TaskController } from "./task.controller";
import { TaskService } from "./task.service";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AccountModule,
    NetworkModule,
    TeleBotModule,
  ],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TaskModule {}
