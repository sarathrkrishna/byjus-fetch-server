import { Body, Controller, Param, Post } from "@nestjs/common";
import { Update } from "./dtos/telebot.dto";
import { TeleBotService } from "./telebot.services";

@Controller("telegram")
export class TeleBotController {
  constructor(private readonly telebotService: TeleBotService) {}

  @Post("webhook/:teleToken")
  async postUpdateTelegramMessage(
    @Param("teleToken") teleToken: string,
    @Body() body: Update
  ) {
    return this.telebotService.postUpdateTelegramMessage(teleToken, body);
  }
}
