import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { NetworkModule } from "src/network/network.module";
import { PingController } from "./ping.controller";
import { PingService } from "./ping.service";

@Module({
  imports: [NetworkModule, ScheduleModule.forRoot()],
  providers: [PingService],
  controllers: [PingController],
})
export class PingModule {}
