import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '@common/enums/role.enum';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc: Document, ret: Record<string, unknown>) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({
    type: String,
    enum: Object.values(Role),
    default: Role.DEVELOPER,
  })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  phone?: string;

  @Prop()
  photo?: string;

  @Prop()
  description?: string;

  @Prop({ type: Date })
  lastLogin?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes (email already has unique: true, so no need to add index again)
UserSchema.index({ createdAt: -1 });
