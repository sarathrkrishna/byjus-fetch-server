import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AccountModule } from "src/account/account.module";
import { NetworkModule } from "src/network/network.module";
import { TaskService } from "./task.service";

@Module({
  imports: [ScheduleModule.forRoot(), AccountModule, NetworkModule],
  providers: [TaskService],
})
export class TaskModule {}
