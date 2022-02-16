import { Injectable } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { AccountService } from 'src/account/account.service';
import { FETCH_CYCLE_CRON_NAME } from 'src/shared/constants/code-constants';

@Injectable()
export class TaskService {
  constructor(
    private readonly accountService: AccountService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  @Cron('*/11 * * * * *', {
    name: FETCH_CYCLE_CRON_NAME,
  })
  async handleTask() {
    const job = this.schedulerRegistry.getCronJob(FETCH_CYCLE_CRON_NAME);
    // execute
  }
}
