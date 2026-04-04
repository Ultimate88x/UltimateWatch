import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isNotEqualTo', async: false })
export class IsNotEqualToConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints as string[];
    const targetObject = args.object as Record<string, unknown>;
    const relatedValue = targetObject[relatedPropertyName];

    if (value === undefined || relatedValue === undefined) {
      return true;
    }

    return value !== relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName, relatedFriendlyName, currentFriendlyName] =
      args.constraints as string[];

    const labelToCompare = relatedFriendlyName || relatedPropertyName;
    const labelCurrent = currentFriendlyName || args.property;

    return `${labelCurrent} cannot be the same as ${labelToCompare}`;
  }
}
