/**
 * Theme Database Seeding Script (TypeScript)
 *
 * This script populates the database with sample theme data from dev-data/themes.json
 *
 * Usage:
 *   npx ts-node scripts/seed-themes.ts seed         - Seed themes
 *   npx ts-node scripts/seed-themes.ts delete       - Delete all themes
 *   npx ts-node scripts/seed-themes.ts reset        - Delete and re-seed themes
 */

import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

// Configure dotenv
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import schemas - we need to manually define them here for standalone script
import { Theme, ThemeSchema } from '@/modules/theme/schema/theme.schema';
import { User, UserSchema } from '../src/modules/users/schema/userSchema';

// Logger for scripts (console is allowed in scripts)
/* eslint-disable no-console */
const logger = {
  info: (message: string) => console.log(message),
  error: (message: string) => console.error(message),
  warn: (message: string) => console.warn(message),
};
/* eslint-enable no-console */

// Create models
const ThemeModel = mongoose.model(Theme.name, ThemeSchema);
const UserModel = mongoose.model(User.name, UserSchema);

// MongoDB connection
const connectDB = async (): Promise<void> => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || process.env.DATABASE || 'mongodb://localhost:27017/app';
    await mongoose.connect(mongoUri);
    logger.info('✅ MongoDB connected successfully');
    logger.info(`🔗 Connected to: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
  } catch (error: any) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Read theme data
const readThemeData = (): any[] => {
  try {
    const dataPath = path.join(__dirname, '..', 'dev-data', 'themes.json');
    const data = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    logger.error(`❌ Error reading theme data: ${error.message}`);
    logger.error('   Make sure dev-data/themes.json exists');
    process.exit(1);
  }
};

// Get or create default user for theme ownership
const getDefaultUser = async (): Promise<any> => {
  try {
    // Look for superAdmin user first
    let user = await UserModel.findOne({ role: 'superAdmin' }).sort({ createdAt: 1 });

    if (!user) {
      // Look for any admin user
      user = await UserModel.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    }

    if (!user) {
      // Look for any user
      user = await UserModel.findOne().sort({ createdAt: 1 });
    }

    if (!user) {
      // Create a default superAdmin user if none exists
      logger.info('⚠️  No users found, creating default superAdmin user...');
      const hashedPassword = await bcrypt.hash('Admin@123', 10);

      user = await UserModel.create({
        name: 'System Administrator',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'superAdmin',
        isEmailVerified: true,
        isActive: true,
      });
      logger.info('✅ Default superAdmin user created');
      logger.info('   Email: admin@example.com');
      logger.info('   Password: Admin@123');
      logger.warn('   ⚠️  Please change this password after first login!');
    } else {
      logger.info(`✅ Using existing user: ${user.email} (${user.role})`);
    }

    return user;
  } catch (error: any) {
    logger.error(`❌ Error getting/creating default user: ${error.message}`);
    process.exit(1);
  }
};

// Seed themes into database
const seedThemes = async (): Promise<void> => {
  try {
    logger.info('🌱 Starting theme seeding process...');

    const defaultUser = await getDefaultUser();
    const themes = readThemeData();

    logger.info(`📦 Found ${themes.length} themes to seed`);

    // Add timestamps and user references to themes
    const themesWithMetadata = themes.map((theme) => ({
      ...theme,
      createdBy: defaultUser._id,
      updatedBy: defaultUser._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Insert themes
    const createdThemes = await ThemeModel.insertMany(themesWithMetadata);
    logger.info(`✅ Successfully seeded ${createdThemes.length} themes`);

    // List created themes
    createdThemes.forEach((theme, index) => {
      logger.info(
        `   ${index + 1}. ${theme.name} (${theme.version})${theme.isActive ? ' [ACTIVE]' : ''}${theme.isDefault ? ' [DEFAULT]' : ''}`,
      );
    });

    // Set the first theme as active and default if no active theme exists
    const activeTheme = await ThemeModel.findOne({ isActive: true });
    if (!activeTheme && createdThemes.length > 0) {
      await ThemeModel.findByIdAndUpdate(createdThemes[0]._id, {
        isActive: true,
        isDefault: true,
      });
      logger.info(`\n✅ Set "${createdThemes[0].name}" as active and default theme`);
    }

    logger.info('\n🎉 Theme seeding completed successfully!');
  } catch (error: any) {
    if (error.code === 11000) {
      logger.error('❌ Error: Some themes already exist (duplicate names)');
      logger.error('   Run "npx ts-node scripts/seed-themes.ts reset" to delete and re-seed');
    } else {
      logger.error(`❌ Error seeding themes: ${error.message}`);
    }
    process.exit(1);
  }
};

// Delete all themes
const deleteThemes = async (): Promise<void> => {
  try {
    logger.info('🗑️  Deleting all themes...');
    const result = await ThemeModel.deleteMany({});
    logger.info(`✅ Deleted ${result.deletedCount} themes`);
  } catch (error: any) {
    logger.error(`❌ Error deleting themes: ${error.message}`);
    process.exit(1);
  }
};

// Reset themes (delete and re-seed)
const resetThemes = async (): Promise<void> => {
  try {
    logger.info('🔄 Resetting themes...\n');
    await deleteThemes();
    logger.info('');
    await seedThemes();
    logger.info('\n✅ Theme reset completed!');
  } catch (error: any) {
    logger.error(`❌ Error resetting themes: ${error.message}`);
    process.exit(1);
  }
};

// Main execution logic
const main = async (): Promise<void> => {
  await connectDB();

  const command = process.argv[2];

  try {
    switch (command) {
      case 'seed':
        await seedThemes();
        break;
      case 'delete':
        await deleteThemes();
        break;
      case 'reset':
        await resetThemes();
        break;
      default:
        logger.info(`
🎨 Theme Database Seeding Script

Available commands:
  seed    - Seed themes from dev-data/themes.json
  delete  - Delete all themes from database
  reset   - Delete all themes and re-seed

Usage:
  npx ts-node scripts/seed-themes.ts <command>
  
Examples:
  npx ts-node scripts/seed-themes.ts seed
  npx ts-node scripts/seed-themes.ts delete
  npx ts-node scripts/seed-themes.ts reset

You can also add npm scripts to package.json:
  "seed:themes": "ts-node scripts/seed-themes.ts seed",
  "seed:themes:delete": "ts-node scripts/seed-themes.ts delete",
  "seed:themes:reset": "ts-node scripts/seed-themes.ts reset"
        `);
        break;
    }
  } catch (error: any) {
    logger.error(`❌ Script execution failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('\n📝 Database connection closed');
    process.exit(0);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: any) => {
  logger.error(`❌ Unhandled Promise Rejection: ${error.message}`);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: any) => {
  logger.error(`❌ Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Run the script
main();
