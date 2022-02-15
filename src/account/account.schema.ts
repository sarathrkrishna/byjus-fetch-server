import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountDocument = Account & Document;

@Schema()
// accounts collection
export class Account {
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
