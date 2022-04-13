import { Injectable } from "@nestjs/common";
import { JsonEncService } from "src/json-enc/jsonenc.service";
import { LinkAuthDto } from "src/telegram-bot/dtos/telebot.dto";
import { GetSolvePageInputDto } from "./dtos/solve.dto";

@Injectable()
export class SolveService {
  constructor(private readonly jsonEncService: JsonEncService) {}
  async getSolvePage(query: GetSolvePageInputDto) {
    const { postDocId, postId, userId } =
      this.jsonEncService.decrypt<LinkAuthDto>(query.ukey);

    return { postDocId, postId, userId };
  }
}
