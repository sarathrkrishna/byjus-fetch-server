import { Body, Controller, Delete, Patch, Post } from "@nestjs/common";
import {
  CreateUserDto,
  DeleteUserAccountDto,
  DeleteUserDto,
  UpdateUserDto,
  UserAccUpdateDto,
} from "./dto/user.dto";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("create")
  createUser(@Body() body: CreateUserDto) {
    return this.userService.createUser(body);
  }

  @Patch("edit")
  updateUser(@Body() body: UpdateUserDto) {
    return this.userService.updateUserDetails(body);
  }

  @Patch("edit-accounts")
  updateAccounts(@Body() body: UserAccUpdateDto) {
    return this.userService.updateUserAccounts(body);
  }

  @Delete("delete-account")
  deleteUserAccounts(@Body() body: DeleteUserAccountDto) {
    return this.userService.deleteUserAccounts(body);
  }

  @Delete("delete")
  deleteUser(@Body() body: DeleteUserDto) {
    return this.userService.deleteUser(body);
  }
}
