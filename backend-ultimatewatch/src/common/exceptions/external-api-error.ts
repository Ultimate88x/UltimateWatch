import { BadGatewayException } from '@nestjs/common';

export class ExternalApiError extends BadGatewayException {
  constructor(context: string) {
    const message = `Unexpected error in external API connection - ${context}`;

    super(message);
  }
}
