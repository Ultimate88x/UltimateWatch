export class CreateUserDto {
  username: string;
  email: string;
  password: string;
  imagePath?: string;
  imagePublicId?: string;
}
