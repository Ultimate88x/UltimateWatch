import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isUniqueArray', async: false })
export class IsUniqueArrayConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (!Array.isArray(value)) {
      return true;
    }

    const uniqueItems = new Set(value);
    return value.length === uniqueItems.size;
  }

  defaultMessage(args: ValidationArguments) {
    const [friendlyName] = args.constraints as string[];

    const label = friendlyName || args.property;

    return `${label} must not contain duplicate values`;
  }
}
