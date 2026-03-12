import { NotFoundException } from '@nestjs/common';

export class ResourceNotFoundException extends NotFoundException {
  constructor(resourceName?: string, parameter?: string, value?: string) {
    const message = resourceName
      ? `${resourceName} with ${parameter} = ${value} not found`
      : 'Resource not found';

    super(message);
  }
}
