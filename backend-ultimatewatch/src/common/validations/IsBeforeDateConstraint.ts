import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAfterDate', async: false })
export class IsBeforeDateConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints as string[];
    const targetObject = args.object as Record<string, unknown>;
    const relatedValue = targetObject[relatedPropertyName];

    if (!(value instanceof Date) || !(relatedValue instanceof Date)) {
      return true;
    }

    return value <= relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName, relatedFriendlyName, currentFriendlyName] =
      args.constraints as string[];

    const labelToCompare = relatedFriendlyName || relatedPropertyName;
    const labelCurrent = currentFriendlyName || args.property;

    return `${labelCurrent} must be less than or equal to ${labelToCompare}`;
  }
}
