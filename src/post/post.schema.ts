import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaObj } from "mongoose";
import { Account } from "src/account/account.schema";
import { ObjectId } from "src/shared/dtos/mongo.dto";

export type PostDocument = Post & Document;

@Schema()
export class Post {
  _id?: ObjectId;

  @Prop({ required: true })
  postId: number;

  @Prop({ type: SchemaObj.Types.ObjectId, ref: "Account" })
  accountId: ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  subjectName: string;

  @Prop({ required: true })
  grade: string;

  @Prop({ required: true })
  totalPoints: number;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  updatedAt: number;

  @Prop({ required: true })
  subjectExpertName: string;

  @Prop({ required: true })
  canAnswerTill: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);
