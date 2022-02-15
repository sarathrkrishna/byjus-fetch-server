import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';

const NODE_ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: NODE_ENV ? `.env.${NODE_ENV}` : '.env',
      load: [configuration], // load the configuration
    }),
    MongooseModule.forRoot(
      'mongodb+srv://sark:sarkByjus123@cluster0.wiadp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
    ),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
