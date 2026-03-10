/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { ConfigurationError } from 'src/common/exceptions/configuration-error';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {
    const apiKey: string | undefined =
      this.configService.get<string>('SENDGRID_API_KEY');

    if (!apiKey) {
      throw new ConfigurationError('Email Configuration');
    }

    sgMail.setApiKey(apiKey);
  }

  async sendPasswordRecoveryEmail(to: string, username: string, token: string) {
    const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');
    const fromName = this.configService.get<string>('SENDGRID_FROM_NAME');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const recoveryLink = `${frontendUrl}/reset-password?token=${token}`;

    if (!fromEmail || !frontendUrl) {
      throw new ConfigurationError('Email Configuration');
    }

    const msg = {
      to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: 'Password Reset Request - MovieApp',
      text: `Hi ${username}, you requested to reset your password. Please click the following link to proceed: ${recoveryLink}. If you did not make this request, please ignore this email.`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; padding: 30px; border-radius: 12px;">
        <h2 style="color: #6D28D9;">Hi, ${username}</h2>
        <p style="color: #333; line-height: 1.5;">We received a request to reset the password for your <strong>UltimateWatch</strong> account.</p>
        <div style="text-align: center; margin: 35px 0;">
        <a href="${recoveryLink}" 
            style="background-color: #6D28D9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Reset Your Password
        </a>
        </div>
        <p style="font-size: 13px; color: #666;">
        This link will expire in 60 minutes. If the button above doesn't work, copy and paste this URL into your browser:<br>
        <a href="${recoveryLink}" style="color: #6D28D9;">${recoveryLink}</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 25px 0;">
        <p style="font-size: 11px; color: #999; font-style: italic;">If you didn't request this change, you can safely ignore this email. No changes will be made to your account.</p>
      </div>
      `,
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error('SendGrid error:', error);
      throw new InternalServerErrorException(
        'Failed to send the recovery email',
      );
    }
  }
}
