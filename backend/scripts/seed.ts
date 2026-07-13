/**
 * Unified seed CLI for the template.
 *
 * Usage:
 *   npm run seed              - seed admin user + themes
 *   npm run seed -- --reset   - wipe themes and re-seed
 *
 * Env (optional overrides):
 *   SEED_ADMIN_EMAIL=admin@example.com
 *   SEED_ADMIN_PASSWORD=Admin@123
 */

import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { Theme, ThemeSchema } from '../src/modules/theme/schema/theme.schema';
import { User, UserSchema } from '../src/modules/users/schema/userSchema';
import { Item, ItemSchema, ItemStatus } from '../src/modules/items/schema/item.schema';

/* eslint-disable no-console */
const logger = {
  info: (message: string) => console.log(message),
  error: (message: string) => console.error(message),
  warn: (message: string) => console.warn(message),
};
/* eslint-enable no-console */

const ThemeModel = mongoose.model(Theme.name, ThemeSchema);
const UserModel = mongoose.model(User.name, UserSchema);
const ItemModel = mongoose.model(Item.name, ItemSchema);

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

async function connectDB(): Promise<void> {
  const mongoUri =
    process.env.MONGODB_URI || process.env.DATABASE || 'mongodb://localhost:27017/app';
  await mongoose.connect(mongoUri);
  logger.info(`Connected to MongoDB`);
}

async function ensureAdminUser() {
  let user = await UserModel.findOne({ email: ADMIN_EMAIL });

  if (!user) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    user = await UserModel.create({
      name: 'System Administrator',
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'superAdmin',
      isEmailVerified: true,
      isActive: true,
    });
    logger.info(`Created superAdmin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    logger.warn('Change the default password after first login.');
  } else {
    logger.info(`Admin already exists: ${user.email}`);
  }

  return user;
}

async function seedThemes(userId: mongoose.Types.ObjectId, reset: boolean) {
  if (reset) {
    const deleted = await ThemeModel.deleteMany({});
    logger.info(`Deleted ${deleted.deletedCount} themes`);
  }

  const existing = await ThemeModel.countDocuments();
  if (existing > 0 && !reset) {
    logger.info(`Themes already seeded (${existing}). Pass --reset to re-seed.`);
    return;
  }

  const dataPath = path.join(__dirname, '..', 'dev-data', 'themes.json');
  if (!fs.existsSync(dataPath)) {
    logger.warn('dev-data/themes.json not found — skipping themes');
    return;
  }

  const themes = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as Record<string, unknown>[];
  const docs = themes.map((theme) => ({
    ...theme,
    createdBy: userId,
    updatedBy: userId,
  }));

  const created = await ThemeModel.insertMany(docs);
  logger.info(`Seeded ${created.length} themes`);

  if (created.length > 0) {
    await ThemeModel.findByIdAndUpdate(created[0]._id, {
      isActive: true,
      isDefault: true,
    });
  }
}

async function seedSampleItems(userId: mongoose.Types.ObjectId, reset: boolean) {
  if (reset) {
    await ItemModel.deleteMany({});
  }

  const existing = await ItemModel.countDocuments();
  if (existing > 0 && !reset) {
    logger.info(`Items already seeded (${existing}). Pass --reset to re-seed.`);
    return;
  }

  await ItemModel.insertMany([
    {
      title: 'Welcome item',
      description: 'Example CRUD record — delete me and copy the Items module for your features.',
      status: ItemStatus.ACTIVE,
      createdBy: userId,
    },
    {
      title: 'Draft item',
      description: 'Another sample in draft status.',
      status: ItemStatus.DRAFT,
      createdBy: userId,
    },
  ]);
  logger.info('Seeded sample items');
}

async function main() {
  const reset = process.argv.includes('--reset');

  try {
    await connectDB();
    const admin = await ensureAdminUser();
    await seedThemes(admin._id as mongoose.Types.ObjectId, reset);
    await seedSampleItems(admin._id as mongoose.Types.ObjectId, reset);
    logger.info('Seed completed.');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Seed failed: ${message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
