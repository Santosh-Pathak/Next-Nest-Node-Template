import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from '../schemas/otp.schema';
import { DocumentDao } from '@shared/services/document-dao.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private documentDao: DocumentDao,
  ) {}

  /**
   * Generate a random 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate and save OTP for email verification or password reset
   * @param email - User email
   * @param expirationMinutes - OTP expiration time in minutes (default: 10)
   */
  async generateEmailOtp(email: string, expirationMinutes = 10): Promise<string> {
    const otp = this.generateOTP();
    const expiresIn = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // Delete any existing OTP for this email
    await this.documentDao.deleteMany(this.otpModel, { email });

    // Create new OTP
    await this.documentDao.create(this.otpModel, {
      email,
      otp,
      expiresIn,
    });

    return otp;
  }

  /**
   * Verify OTP for email
   * @param email - User email
   * @param otp - OTP to verify
   */
  async verifyEmailOtp(email: string, otp: string): Promise<boolean> {
    const otpDoc = await this.documentDao.findOne(this.otpModel, {
      email,
      otp,
      expiresIn: { $gt: new Date() },
    });

    if (!otpDoc) {
      return false;
    }

    // Delete OTP after successful verification
    await this.documentDao.deleteOne(this.otpModel, { _id: otpDoc._id });

    return true;
  }

  /**
   * Delete all OTPs for a specific email
   */
  async deleteOtpsByEmail(email: string): Promise<void> {
    await this.documentDao.deleteMany(this.otpModel, { email });
  }

  /**
   * Clean up expired OTPs (MongoDB TTL index handles this automatically)
   */
  async cleanupExpiredOtps(): Promise<void> {
    await this.documentDao.deleteMany(this.otpModel, {
      expiresIn: { $lt: new Date() },
    });
  }
}
