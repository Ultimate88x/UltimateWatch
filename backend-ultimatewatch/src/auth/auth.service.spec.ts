/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EmailService } from 'src/common/email/email.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;

  const mockUsersService = {
    findByUsername: jest.fn(),
    create: jest.fn(),
    findByEmail: jest.fn(),
    updateResetToken: jest.fn(),
    findByResetToken: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockEmailService = {
    sendPasswordRecoveryEmail: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data if password is correct', async () => {
      const mockUser = { id: 1, username: 'user1', password: 'hashedPassword' };

      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser({
        username: 'user1',
        password: 'password123',
      });

      expect(result).toEqual({ userId: 1, username: 'user1' });
      expect(usersService['findByUsername']).toHaveBeenCalledWith('user1');
    });

    it('should return null if password is incorrect', async () => {
      mockUsersService.findByUsername.mockResolvedValue({ password: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser({
        username: 'user1',
        password: 'wrong',
      });

      expect(result).toBeNull();
    });

    it('should return null if user does not exist', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      const result = await service.validateUser({
        username: 'nonexistent',
        password: 'anyPassword',
      });

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('authenticate', () => {
    it('should throw UnauthorizedException if user is not valid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.authenticate({ username: 'fake', password: 'fake' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return AuthResult if everything is correct', async () => {
      const signInData = { userId: 1, username: 'admin' };
      const authResult = {
        accessToken: 'token123',
        userId: 1,
        username: 'admin',
      };

      jest.spyOn(service, 'validateUser').mockResolvedValue(signInData);
      mockJwtService.signAsync.mockResolvedValue('token123');

      const result = await service.authenticate({
        username: 'admin',
        password: 'password',
      });

      expect(result).toEqual(authResult);
    });
  });

  describe('signIn', () => {
    it('should return an AuthResult if user data is valid', async () => {
      const signInData = { userId: 1, username: 'testuser' };
      const expectedToken = 'signed-jwt-token';

      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      const result = await service.signIn(signInData);

      expect(result).toEqual({
        accessToken: expectedToken,
        userId: 1,
        username: 'testuser',
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        username: 'testuser',
      });
    });

    it('should throw UnauthorizedException if userId is missing', async () => {
      const incompleteUser = { username: 'testuser' } as Partial<{
        userId: number;
        username: string;
      }>;

      await expect(service.signIn(incompleteUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if username is missing', async () => {
      const incompleteUser = { userId: 1 } as Partial<{
        userId: number;
        username: string;
      }>;

      await expect(service.signIn(incompleteUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('signUp', () => {
    it('should create a user and return an AuthResult (auto-login)', async () => {
      const createUserDto = {
        username: 'newuser',
        email: 'test@test.com',
        password: 'password123',
      };

      const mockCreatedUser = {
        id: 1,
        username: 'newuser',
      };

      const expectedAuthResult = {
        accessToken: 'signed-token',
        userId: 1,
        username: 'newuser',
      };

      mockUsersService.create.mockResolvedValue(mockCreatedUser);

      mockJwtService.signAsync.mockResolvedValue('signed-token');

      const result = await service.signUp(createUserDto);

      expect(usersService['create']).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedAuthResult);
    });
  });

  describe('forgotPassword', () => {
    const email = 'test@example.com';
    const mockUser = { id: 1, email: 'test@example.com', username: 'testuser' };

    it('should send an email if the user exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.updateResetToken.mockResolvedValue(true);

      const result = await service.forgotPassword(email);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(usersService.updateResetToken).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
      );
      expect(mockEmailService.sendPasswordRecoveryEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.username,
        expect.any(String),
      );
      expect(result).toEqual({
        message: 'If an account exists, a recovery email has been sent.',
      });
    });

    it('should return the same message even if user does not exist (security best practice)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@test.com');

      expect(mockEmailService.sendPasswordRecoveryEmail).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: 'If an account exists, a recovery email has been sent.',
      });
    });
  });

  describe('resetPasswordWithToken', () => {
    const token = 'valid-token';
    const newPassword = 'newPassword123';

    it('should throw UnauthorizedException if token is empty', async () => {
      await expect(
        service.resetPasswordWithToken('', newPassword),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is invalid or not found', async () => {
      mockUsersService.findByResetToken.mockResolvedValue(null);

      await expect(
        service.resetPasswordWithToken('invalid', newPassword),
      ).rejects.toThrow(new UnauthorizedException('Invalid token'));
    });

    it('should throw UnauthorizedException if the token has expired', async () => {
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 2);

      mockUsersService.findByResetToken.mockResolvedValue({
        id: 1,
        resetTokenExpires: expiredDate,
      });

      await expect(
        service.resetPasswordWithToken(token, newPassword),
      ).rejects.toThrow(
        new UnauthorizedException('The reset link has expired'),
      );
    });

    it('should update the password if token is valid and not expired', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      mockUsersService.findByResetToken.mockResolvedValue({
        id: 1,
        resetTokenExpires: futureDate,
      });
      mockUsersService.updatePassword.mockResolvedValue({ affected: 1 });

      const result = await service.resetPasswordWithToken(token, newPassword);

      expect(usersService.updatePassword).toHaveBeenCalledWith(1, newPassword);
      expect(result).toEqual({ affected: 1 });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
});
