import { Controller, Param, Post } from "@nestjs/common";
import { TaskService } from "./task.service";

@Controller("task")
export class TaskController {
  constructor(private readonly taskService: TaskService) {}
  @Post("webhook/updates/:token")
  getUpdateViaWebhook(@Param("token") telToken: string) {
    return this.taskService.getUpdateViaWebhook(telToken);
  }
}
