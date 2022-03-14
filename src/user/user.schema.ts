import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId, Document } from "mongoose";

export type UserDocument = User & Document;

@Schema()
export class User {
  _id?: ObjectId;

  @Prop({ required: true })
  username?: string;

  @Prop({ required: true })
  password?: string;

  @Prop()
  qid?: string;

  @Prop({ required: true })
  fullName?: string;

  @Prop({ required: true })
  email?: string;

  @Prop()
  chatId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
