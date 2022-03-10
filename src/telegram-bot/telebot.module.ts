import { Module } from "@nestjs/common";
import { TeleBotController } from "./telebot.controller";
import { TeleBotService } from "./telebot.services";

@Module({
  providers: [TeleBotService],
  exports: [TeleBotService],
  controllers: [TeleBotController],
})
export class TeleBotModule {}
