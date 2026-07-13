import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ItemDocument = Item & Document;

export enum ItemStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc: Document, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Item {
  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ trim: true, maxlength: 2000 })
  description?: string;

  @Prop({
    type: String,
    enum: Object.values(ItemStatus),
    default: ItemStatus.DRAFT,
  })
  status: ItemStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

ItemSchema.index({ title: 'text', description: 'text' });
ItemSchema.index({ status: 1, createdAt: -1 });
