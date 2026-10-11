import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { SchedulesService } from '../schedules.service';
import { Role } from 'src/users/enums/role.enum';

interface RequestUser {
  id?: number;
  sub?: number;
  email?: string;
  role?: string;
}

interface RequestWithUser extends Request {
  user?: RequestUser;
  schedule?: unknown;
}

@Injectable()
export class ScheduleOwnershipGuard implements CanActivate {
  constructor(
    private readonly schedulesService: SchedulesService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithUser>();

    const rawId = request.params?.id;
    const scheduleId = Number(rawId);

    if (isNaN(scheduleId) || scheduleId <= 0) {
      throw new BadRequestException(
        'ID lịch hẹn không hợp lệ',
      );
    }

    const currentUser = request.user;
    if (!currentUser) {
      throw new ForbiddenException(
        'Không tìm thấy thông tin người dùng xác thực',
      );
    }

    const schedule =
      await this.schedulesService.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundException(
        `Không tìm thấy lịch hẹn với ID = ${scheduleId}`,
      );
    }

    const userRole = currentUser.role?.toUpperCase();
    const currentUserId = currentUser.id ?? currentUser.sub;

    const isAdmin =
      userRole === Role.ADMIN || userRole === 'ADMIN';
    const isOwner = schedule.userId === currentUserId;

    if (isAdmin || isOwner) {
      request.schedule = schedule;
      return true;
    }

    throw new ForbiddenException(
      'Bạn không có quyền chỉnh sửa hoặc hủy lịch hẹn của người khác!',
    );
  }
}
