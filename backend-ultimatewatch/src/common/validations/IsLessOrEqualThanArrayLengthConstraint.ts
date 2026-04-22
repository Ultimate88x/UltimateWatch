import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isLessOrEqualThanArrayLength', async: false })
export class IsLessOrEqualThanArrayLengthConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints as string[];
    const targetObject = args.object as Record<string, unknown>;
    const relatedValue = targetObject[relatedPropertyName];

    if (typeof value !== 'number' || !Array.isArray(relatedValue)) {
      return true;
    }

    return value <= relatedValue.length;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName, relatedFriendlyName, currentFriendlyName] =
      args.constraints as string[];

    const labelToCompare = relatedFriendlyName || relatedPropertyName;
    const labelCurrent = currentFriendlyName || args.property;

    return `${labelCurrent} cannot be greater than the number of ${labelToCompare}`;
  }
}
