import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'requiredIf', async: false })
export class RequiredIfConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments) {
    const [relatedPropertyName, expectedValue] = args.constraints as [
      string,
      unknown,
    ];

    const targetObject = args.object as Record<string, unknown>;
    const relatedValue = targetObject[relatedPropertyName];

    if (relatedValue === expectedValue) {
      return value !== undefined && value !== null && value !== '';
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName, expectedValue] = args.constraints as [
      string,
      unknown,
    ];

    return `${args.property} is required when ${relatedPropertyName} is ${String(expectedValue)}`;
  }
}
