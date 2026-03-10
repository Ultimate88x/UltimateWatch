/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigurationError } from 'src/common/exceptions/configuration-error';
import sgMail from '@sendgrid/mail';

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

type MockConfig = {
  SENDGRID_API_KEY: string;
  SENDGRID_FROM_EMAIL: string;
  SENDGRID_FROM_NAME: string;
  FRONTEND_URL: string;
};

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  const mockConfig = {
    SENDGRID_API_KEY: 'SG.valid_key',
    SENDGRID_FROM_EMAIL: 'noreply@movieapp.com',
    SENDGRID_FROM_NAME: 'MovieApp Support',
    FRONTEND_URL: 'http://localhost:3000',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key] as MockConfig),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should set the SendGrid API key on initialization', () => {
      expect(sgMail.setApiKey).toHaveBeenCalledWith(
        mockConfig.SENDGRID_API_KEY,
      );
    });

    it('should throw ConfigurationError if API key is missing', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      expect(() => new EmailService(configService)).toThrow(ConfigurationError);
    });
  });

  describe('sendPasswordRecoveryEmail', () => {
    const testEmail = 'user@example.com';
    const testUsername = 'JohnDoe';
    const testToken = 'reset-token-123';

    it('should send an email with correct parameters', async () => {
      (sgMail.send as jest.Mock).mockResolvedValue([{}]);

      await service.sendPasswordRecoveryEmail(
        testEmail,
        testUsername,
        testToken,
      );

      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          from: {
            email: mockConfig.SENDGRID_FROM_EMAIL,
            name: mockConfig.SENDGRID_FROM_NAME,
          },
          subject: expect.any(String) as string,
          text: expect.stringContaining(testToken) as string,
          html: expect.stringContaining(testToken) as string,
        }),
      );
    });

    it('should throw InternalServerErrorException if SendGrid fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      (sgMail.send as jest.Mock).mockRejectedValue(new Error('SendGrid Error'));

      await expect(
        service.sendPasswordRecoveryEmail(testEmail, testUsername, testToken),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
