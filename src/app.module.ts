import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskModule } from './tasks/task.module';
import { ConfigDto } from './config/config.dto';

const NODE_ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: NODE_ENV ? `.env.${NODE_ENV}` : '.env',
      load: [configuration], // load the configuration
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigDto>) => ({
        uri: configService.get('db_connection_string', { infer: true }),
      }),
      inject: [ConfigService],
    }),
    TaskModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
