/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController, RequestWithUser } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    authenticate: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
});
