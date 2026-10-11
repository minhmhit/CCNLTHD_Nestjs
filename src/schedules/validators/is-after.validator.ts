import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAfter', async: false })
export class IsAfterConstraint implements ValidatorConstraintInterface {
  validate(
    propertyValue: string,
    args: ValidationArguments,
  ) {
    const constraints = args.constraints as [string];
    const relatedPropertyName = constraints[0];
    const targetObject = args.object as Record<
      string,
      unknown
    >;
    const relatedValue = targetObject[
      relatedPropertyName
    ] as string;

    if (!propertyValue || !relatedValue) {
      return false;
    }

    const startDate = new Date(relatedValue);
    const endDate = new Date(propertyValue);

    if (
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime())
    ) {
      return false;
    }

    return endDate.getTime() > startDate.getTime();
  }

  defaultMessage(args: ValidationArguments) {
    const constraints = args.constraints as [string];
    const relatedPropertyName = constraints[0];
    return `${args.property} phải sau ${relatedPropertyName}!`;
  }
}

export function IsAfter(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsAfterConstraint,
    });
  };
}
