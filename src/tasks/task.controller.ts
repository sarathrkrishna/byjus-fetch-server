import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { TaskService } from "./task.service";

@Controller("task")
export class TaskController {
  constructor(private readonly taskService: TaskService) {}
  @Post("webhook/updates/:token")
  postUpdateViaWebhook(@Param("token") telToken: string, @Body() body) {
    console.log(telToken, body);
    return;
  }
}
