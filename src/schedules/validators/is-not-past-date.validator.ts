import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({
  name: 'isNotPastDate',
  async: false,
})
export class IsNotPastDateConstraint implements ValidatorConstraintInterface {
  validate(propertyValue: string) {
    if (!propertyValue) {
      return false;
    }

    const date = new Date(propertyValue);
    if (isNaN(date.getTime())) {
      return false;
    }

    // Cho phép trừ 60 giây để xử lý độ trễ mạng và chênh lệch đồng hồ client/server
    const nowThreshold = new Date(Date.now() - 60 * 1000);
    return date.getTime() >= nowThreshold.getTime();
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} phải lớn hơn hoặc bằng thời điểm hiện tại!`;
  }
}

export function IsNotPastDate(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotPastDateConstraint,
    });
  };
}
