import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AccountModule } from "src/account/account.module";
import { AccountUserMasterModule } from "src/account_user_master/account.user.master.module";
import { UserController } from "./user.controller";
import { User, UserSchema } from "./user.schema";
import { UserService } from "./user.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AccountModule,
    AccountUserMasterModule,
  ],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
