import { Injectable, Logger } from "@nestjs/common";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { AccountService } from "src/account/account.service";
import {
  FETCH_CYCLE_CRON_NAME,
  FETCH_CYCLE_CRON_TIME,
} from "src/shared/constants/code-constants";
import { getCurrentLocalTime } from "src/shared/utils/general-utilities";

@Injectable()
export class TaskService {
  private logger = new Logger(TaskService.name);
  private fetchCycleCronJob: CronJob;

  constructor(
    private readonly accountService: AccountService,
    private readonly schedulerRegistry: SchedulerRegistry
  ) {}

  @Cron(FETCH_CYCLE_CRON_TIME, {
    name: FETCH_CYCLE_CRON_NAME,
  })
  async handleTask() {
    this.fetchCycleCronJob = this.schedulerRegistry.getCronJob(
      FETCH_CYCLE_CRON_NAME
    );
    // execute
  }
}
