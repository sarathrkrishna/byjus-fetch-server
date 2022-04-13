import { Controller, Get, Query } from "@nestjs/common";
import { GetSolvePageInputDto } from "./dtos/solve.dto";
import { SolveService } from "./solve.service";

@Controller("solve")
export class SolveController {
  constructor(private readonly solveService: SolveService) {}
  @Get("solve-page")
  getSolvePage(@Query() query: GetSolvePageInputDto) {
    return this.solveService.getSolvePage(query);
  }
}
