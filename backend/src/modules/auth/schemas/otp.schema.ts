import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({
  timestamps: true,
  collection: 'otps',
})
export class Otp {
  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'is invalid'],
    index: true,
  })
  email: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true })
  expiresIn: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Index for faster queries and automatic TTL deletion
OtpSchema.index({ email: 1, expiresIn: 1 });
OtpSchema.index({ expiresIn: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup
