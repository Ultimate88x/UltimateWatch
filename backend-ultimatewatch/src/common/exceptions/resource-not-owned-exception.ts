import { ForbiddenException } from '@nestjs/common';

export class ResourceNotOwnedException extends ForbiddenException {
  constructor(resourceName?: string) {
    const message = resourceName
      ? `You are not the owner of this resource (${resourceName})`
      : 'You are not the owner of this resource';

    super(message);
  }
}
