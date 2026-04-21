import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TokenDocument = Token & Document;

export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
  RESET_PASSWORD = 'RESET_PASSWORD',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
}

@Schema({
  timestamps: true,
  collection: 'tokens',
})
export class Token {
  @Prop({ required: true, index: true })
  token: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(TokenType), index: true })
  type: TokenType;

  @Prop({ required: true })
  expires: Date;

  @Prop({ default: false, index: true })
  blacklisted: boolean;
}

export const TokenSchema = SchemaFactory.createForClass(Token);

// Compound indexes for better query performance
TokenSchema.index({ user: 1, type: 1 });
TokenSchema.index({ token: 1, type: 1, blacklisted: 1 });
TokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup
