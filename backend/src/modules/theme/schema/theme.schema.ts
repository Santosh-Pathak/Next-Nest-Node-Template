import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Color palette sub-schemas
class ColorShades {
  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  50: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  100: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  200: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  300: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  400: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  500: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  600: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  700: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  800: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  900: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  950: string;
}

class StateColorShades {
  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  50: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  500: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  600: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  700: string;
}

@Schema({ _id: false })
export class ColorPalette {
  @Prop({ type: ColorShades, required: true })
  primary: ColorShades;

  @Prop({ type: ColorShades, required: true })
  secondary: ColorShades;

  @Prop({ type: ColorShades, required: true })
  neutral: ColorShades;

  @Prop({ type: StateColorShades, required: true })
  success: StateColorShades;

  @Prop({ type: StateColorShades, required: true })
  warning: StateColorShades;

  @Prop({ type: StateColorShades, required: true })
  error: StateColorShades;

  @Prop({ type: StateColorShades, required: true })
  info: StateColorShades;
}

// Background configuration
class BackgroundConfig {
  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  primary: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  secondary: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  tertiary: string;
}

class ForegroundConfig {
  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  primary: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  secondary: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  muted: string;
}

class BorderConfig {
  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  default: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  muted: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  strong: string;
}

class SurfaceConfig {
  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  default: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  elevated: string;

  @Prop({ required: true })
  overlay: string;
}

class InteractiveConfig {
  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  primary: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  primaryHover: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  primaryActive: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  secondary: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  secondaryHover: string;

  @Prop({ required: true, match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ })
  secondaryActive: string;
}

@Schema({ _id: false })
export class ThemeConfig {
  @Prop({ type: BackgroundConfig, required: true })
  background: BackgroundConfig;

  @Prop({ type: ForegroundConfig, required: true })
  foreground: ForegroundConfig;

  @Prop({ type: BorderConfig, required: true })
  border: BorderConfig;

  @Prop({ type: SurfaceConfig, required: true })
  surface: SurfaceConfig;

  @Prop({ type: InteractiveConfig, required: true })
  interactive: InteractiveConfig;
}

// Theme preset
class PreviewConfig {
  @Prop()
  image?: string;

  @Prop({
    type: [String],
    validate: { validator: (v: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v) },
  })
  colors: string[];
}

@Schema({ _id: false })
export class ThemePreset {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: ColorPalette, required: true })
  colorPalette: ColorPalette;

  @Prop({ type: ThemeConfig, required: true })
  lightTheme: ThemeConfig;

  @Prop({ type: ThemeConfig, required: true })
  darkTheme: ThemeConfig;

  @Prop({ type: PreviewConfig })
  preview: PreviewConfig;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ type: [String], trim: true })
  tags: string[];
}

// Metadata
class ThemeMetadata {
  @Prop({ default: 0 })
  exportCount: number;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop({ default: Date.now })
  lastUsed: Date;
}

// Settings
class ThemeSettings {
  @Prop({ default: true })
  allowUserCustomization: boolean;

  @Prop({ default: true })
  enablePreview: boolean;

  @Prop({ default: true })
  autoGenerateShades: boolean;
}

// Main theme schema
@Schema({ timestamps: true })
export class Theme {
  @Prop({ required: true, trim: true, unique: true, maxlength: 100 })
  name: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  description: string;

  @Prop({ required: true, default: '1.0.0', match: /^\d+\.\d+\.\d+$/ })
  version: string;

  @Prop({ type: ColorPalette, required: true })
  colorPalette: ColorPalette;

  @Prop({ type: ThemeConfig, required: true })
  lightTheme: ThemeConfig;

  @Prop({ type: ThemeConfig, required: true })
  darkTheme: ThemeConfig;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  @Prop({ type: ThemeMetadata, default: () => ({}) })
  metadata: ThemeMetadata;

  @Prop({ type: [ThemePreset], default: [] })
  presets: ThemePreset[];

  @Prop({ type: ThemeSettings, default: () => ({}) })
  settings: ThemeSettings;

  createdAt: Date;
  updatedAt: Date;
}

export type ThemeDocument = Theme & Document;

export const ThemeSchema = SchemaFactory.createForClass(Theme);

// Indexes
ThemeSchema.index({ isActive: 1, isDefault: 1 });
ThemeSchema.index({ createdBy: 1 });
ThemeSchema.index({ 'metadata.lastUsed': -1 });
ThemeSchema.index({ 'presets.isDefault': 1 });

// Pre-save middleware to ensure only one default/active theme
ThemeSchema.pre('save', async function (next) {
  const Theme = this.constructor as any;

  if (this.isDefault && this.isModified('isDefault')) {
    await Theme.updateMany({ _id: { $ne: this._id } }, { $set: { isDefault: false } });
  }

  if (this.isActive && this.isModified('isActive')) {
    await Theme.updateMany({ _id: { $ne: this._id } }, { $set: { isActive: false } });
  }

  next();
});
