import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AccountModule } from 'src/account/account.module';
import { TaskService } from './task.service';

@Module({
  imports: [ScheduleModule.forRoot(), AccountModule],
  providers: [TaskService],
})
export class TaskModule {}
