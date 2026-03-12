import { ConflictException } from '@nestjs/common';

export class DuplicatedResourceException extends ConflictException {
  constructor(resourceName?: string, parameter?: string) {
    const message = resourceName
      ? `A ${resourceName} with that ${parameter} already exists`
      : 'A resource with that parameter already exists';

    super(message);
  }
}
