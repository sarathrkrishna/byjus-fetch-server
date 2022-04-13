import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration from "./config/configuration";
import { MongooseModule } from "@nestjs/mongoose";
import { TaskModule } from "./tasks/task.module";
import { ConfigDto } from "./config/config.dto";
import { NetworkModule } from "./network/network.module";
import { TeleBotModule } from "./telegram-bot/telebot.module";
import { AppService } from "./app.service";
import { UserModule } from "./user/user.module";
import { PingModule } from "./server-ping/ping.module";
import { PostModule } from "./post/post.module";
import { JsonEncModule } from "./json-enc/jsonenc.module";
import { SolveModule } from "./solve/solve.module";

const NODE_ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: NODE_ENV
        ? NODE_ENV === "heroku-diploy" // set NODE_ENV=heroku-diploy in heroku app (heroku keeps env file as '.env')
          ? ".env"
          : `.env.${NODE_ENV}`
        : ".env",
      load: [configuration], // load the configuration
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigDto>) => ({
        uri: configService.get("db_connection_string", { infer: true }),
      }),
      inject: [ConfigService],
    }),
    TaskModule,
    NetworkModule,
    TeleBotModule,
    UserModule,
    PingModule,
    PostModule,
    JsonEncModule,
    SolveModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
