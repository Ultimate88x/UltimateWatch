import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { Readable } from 'stream';
import { ExternalApiError } from '../exceptions/external-api-error';

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'profile_pics',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          ],
        },
        (error, result) => {
          if (error)
            return reject(
              new ExternalApiError(error.message || 'Cloudinary upload failed'),
            );
          if (result) resolve(result);
        },
      );

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      stream.pipe(upload);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    try {
      const result = (await cloudinary.uploader.destroy(publicId)) as {
        result: string;
      };

      if (result.result !== 'ok' && result.result !== 'not_found') {
        throw new ExternalApiError('Cloudinary delete failed');
      }

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Cloudinary delete failed';
      throw new ExternalApiError(message);
    }
  }

  async updateDtoImage(
    dto: CreateUserDto | UpdateUserDto,
    file: Express.Multer.File,
  ) {
    const result = await this.uploadImage(file);
    dto.imagePath = (result as { secure_url: string })?.secure_url;
    dto.imagePublicId = (result as { public_id: string })?.public_id;

    return dto;
  }
}
