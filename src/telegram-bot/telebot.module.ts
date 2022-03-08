import { Module } from "@nestjs/common";
import { TeleBotService } from "./telebot.services";

@Module({
  providers: [TeleBotService],
  exports: [TeleBotService],
})
export class TeleBotModule {}
