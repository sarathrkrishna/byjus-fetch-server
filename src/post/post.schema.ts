import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ObjectId } from "src/shared/dtos/mongo.dto";

export type PostDocument = Post & Document;

@Schema()
export class Post {
  _id?: ObjectId;

  @Prop({ required: true })
  postId: number;

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
