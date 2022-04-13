import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConfigDto } from "src/config/config.dto";
const { createCodec } = require("json-crypto");

@Injectable()
export class JsonEncService {
  private codec;
  constructor(private readonly configService: ConfigService<ConfigDto>) {
    this.codec = createCodec(this.configService.get("json_enc_key"));
  }
  encrypt<Obj>(data: Obj): string {
    return this.codec.encrypt(data);
  }
  decrypt<Obj>(crypto: string): Obj {
    return this.codec.decrypt(crypto);
  }
}
