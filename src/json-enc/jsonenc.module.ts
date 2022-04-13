import { Module } from "@nestjs/common";
import { JsonEncService } from "./jsonenc.service";

@Module({
  providers: [JsonEncService],
  exports: [JsonEncService],
})
export class JsonEncModule {}
