/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController, RequestWithUser } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    authenticate: jest.fn(),
    signUp: jest.fn(),
    forgotPassword: jest.fn(),
    resetPasswordWithToken: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockCloudinaryService = {
    updateDtoImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call authService.authenticate and return the result', async () => {
      const loginDto = { username: 'test', password: '123' };
      const expectedResult = {
        accessToken: 'token',
        userId: 1,
        username: 'test',
      };

      mockAuthService.authenticate.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(authService.authenticate).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUserInfo', () => {
    it('should return the user data from the request', () => {
      const mockRequest = {
        user: { userId: 1, username: 'testuser' },
      } as RequestWithUser;

      const result = controller.getUserInfo(mockRequest);

      expect(result).toEqual({ userId: 1, username: 'testuser' });
    });
  });

  describe('signUp', () => {
    it('should call cloudinaryService if a file is provided and return authService.signUp result', async () => {
      const signUpDto = {
        username: 'newuser',
        email: 'test@test.com',
        password: 'password123',
      };

      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.png',
        mimetype: 'image/png',
      } as Express.Multer.File;

      const expectedResult = {
        accessToken: 'token-after-signup',
        userId: 1,
        username: 'newuser',
      };

      mockCloudinaryService.updateDtoImage.mockResolvedValue(signUpDto);
      mockAuthService.signUp.mockResolvedValue(expectedResult);

      const result = await controller.signUp(signUpDto, mockFile);

      expect(mockCloudinaryService.updateDtoImage).toHaveBeenCalledWith(
        signUpDto,
        mockFile,
      );
      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(result).toEqual(expectedResult);
    });

    it('should call authService.signUp directly if no file is provided', async () => {
      const signUpDto = {
        username: 'newuser',
        email: 'test@test.com',
        password: 'password123',
      };
      const expectedResult = {
        accessToken: 'token',
        userId: 1,
        username: 'newuser',
      };

      mockAuthService.signUp.mockResolvedValue(expectedResult);

      const result = await controller.signUp(signUpDto, undefined);

      expect(mockCloudinaryService.updateDtoImage).not.toHaveBeenCalled();
      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword and return a success message', async () => {
      const forgotPasswordDto = { email: 'user@example.com' };
      const expectedResult = {
        message: 'If an account exists, a recovery email has been sent.',
      };

      mockAuthService.forgotPassword.mockResolvedValue(expectedResult);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto.email,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPasswordWithToken and return the result', async () => {
      const resetPasswordDto = {
        token: 'valid-token-123',
        newPassword: 'newSecurePassword123',
      };
      const expectedResult = { affected: 1 };

      mockAuthService.resetPasswordWithToken.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(authService.resetPasswordWithToken).toHaveBeenCalledWith(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
