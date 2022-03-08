import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import { ConfigDto } from "src/config/config.dto";
import { TELE_BOT_BASE_URL } from "src/shared/constants/code-constants";

@Injectable()
export class TeleBotService {
  private teleAxiosClient: AxiosInstance = axios.create({
    baseURL:
      TELE_BOT_BASE_URL + `bot${this.configService.get("tel_bot_token")}/`,
    headers: {
      ["Content-Type"]: "application/json",
    },
  });

  constructor(private readonly configService: ConfigService<ConfigDto>) {}

  sendMessageToUser(chatId: string, text = "") {
    return this.teleAxiosClient.post("/sendMessage", {
      chat_id: chatId,
      text,
    });
  }

  getUpdates(params: {
    offset?: number;
    limit?: number;
    allowed_updates?: string[];
  }) {
    return this.teleAxiosClient.get("/getUpdates", {
      params,
    });
  }
}
