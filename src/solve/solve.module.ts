import { Module } from "@nestjs/common";
import { JsonEncModule } from "src/json-enc/jsonenc.module";
import { SolveController } from "./solve.controller";
import { SolveService } from "./solve.service";

@Module({
  imports: [JsonEncModule],
  providers: [SolveService],
  controllers: [SolveController],
})
export class SolveModule {}
