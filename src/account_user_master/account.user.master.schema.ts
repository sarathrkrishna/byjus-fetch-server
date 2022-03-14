import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaObj } from "mongoose";
import { ObjectId } from "src/shared/dtos/mongo.dto";

export type AccountUserMasterDocument = AccountUserMaster & Document;

@Schema()
export class AccountUserMaster {
  _id?: ObjectId;

  @Prop({ type: SchemaObj.Types.ObjectId, ref: "User" })
  userId?: ObjectId;

  @Prop({ type: SchemaObj.Types.ObjectId, ref: "Account" })
  accountId?: ObjectId;
}

export const AccountUserMasterSchema =
  SchemaFactory.createForClass(AccountUserMaster);
