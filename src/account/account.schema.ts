import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'src/shared/dtos/mongo.dto';

export type AccountDocument = Account & Document;

// accounts collection
@Schema()
export class Account {
  _id: ObjectId;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  lastLogin: number;

  @Prop()
  token: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
