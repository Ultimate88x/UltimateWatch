import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

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
              new Error(error.message || 'Cloudinary upload failed'),
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
        throw new Error('Cloudinary delete failed');
      }

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Cloudinary delete failed';
      throw new Error(message);
    }
  }
}
