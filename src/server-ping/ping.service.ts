import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { ConfigDto } from "src/config/config.dto";
import { NetworkService } from "src/network/network.service";
import {
  SERVER_TICK_CRON_NAME,
  SERVER_TICK_CRON_TIME,
} from "src/shared/constants/code-constants";
import { getCurrentLocalTime } from "src/shared/utils/general-utilities";

@Injectable()
export class PingService {
  private logger = new Logger(PingService.name);
  constructor(private readonly networkService: NetworkService) {}

  @Cron(SERVER_TICK_CRON_TIME, { name: SERVER_TICK_CRON_NAME })
  async regularPing() {
    await this.networkService.pingSelf();
  }

  pingServer() {
    this.logger.log(`Ping hit @${getCurrentLocalTime()}`);
    return true;
  }
}
