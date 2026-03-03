/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;

  const mockUsersService = {
    findByUsername: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
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
});
