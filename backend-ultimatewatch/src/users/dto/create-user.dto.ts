import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, {
    message: 'Username must be at least 3 characters long',
  })
  username?: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password is too weak. It must contain at least one uppercase letter, one lowercase letter, and one number or special character',
  })
  password?: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsOptional()
  @IsString()
  imagePublicId?: string | null;
}
