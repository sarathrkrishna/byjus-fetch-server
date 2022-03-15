import { Controller, Param, Patch } from "@nestjs/common";
import { TaskService } from "./task.service";

@Controller("task")
export class TaskController {
  constructor(private readonly taskService: TaskService) {}
  @Patch("toggle-all/:state")
  toggleTask(@Param("state") state: "enable" | "disable") {
    return this.taskService.toggleTask(state);
  }
}
