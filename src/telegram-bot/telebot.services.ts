import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import { ConfigDto } from "src/config/config.dto";
import { TELE_BOT_BASE_URL } from "src/shared/constants/code-constants";
import { Update } from "./dtos/telebot.dto";

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
      parse_mode: "HTML",
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

  async postUpdateTelegramMessage(teleToken: string, body: Update) {
    const {
      message: {
        text,
        date,
        from: { first_name: firstName, last_name: lastName, username },
        chat: { id: chatId },
      },
    } = body;

    if (text.match(/^\/start$/gi)) {
      // chat initiation
      await this.sendMessageToUser(
        chatId.toString(),
        `Welcome user.\n Please subscribe by sending\n \\start`
      );
    }

    // const messageText = JSON.stringify({
    //   text,
    //   date,
    //   firstName,
    //   lastName,
    //   username,
    //   chatId,
    // });

    // await this.sendMessageToUser(chatId.toString(), `<b>${messageText}</b>`);

    // console.log(messageText);
  }
}
