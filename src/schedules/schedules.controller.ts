import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { UpdateScheduleStatusDto } from './dto/update-schedule-status.dto';
import { QueryScheduleDto } from './dto/query-schedule.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ScheduleOwnershipGuard } from './guards/schedule-owner.guard';
import {
  ApiCreateScheduleDoc,
  ApiFindAllSchedulesDoc,
  ApiFindOneScheduleDoc,
  ApiRemoveScheduleDoc,
  ApiSchedulesTagDoc,
  ApiTestRollbackScheduleDoc,
  ApiUpdateScheduleDoc,
  ApiUpdateScheduleStatusDoc,
} from 'src/swagger/docs/schedules.doc';

@ApiSchedulesTagDoc()
@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
  ) {}

  @Get()
  @ApiFindAllSchedulesDoc()
  findAll(@Query() query: QueryScheduleDto) {
    return this.schedulesService.findAll(query);
  }

  @Get(':id')
  @ApiFindOneScheduleDoc()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.findById(id);
  }

  @Post()
  @ApiCreateScheduleDoc()
  create(
    @Body() createScheduleDto: CreateScheduleDto,
    @CurrentUser() user: { id: number; email: string },
  ) {
    return this.schedulesService.create(
      createScheduleDto,
      user,
    );
  }

  @Post('test-rollback')
  @ApiTestRollbackScheduleDoc()
  testRollback(
    @Body() createScheduleDto: CreateScheduleDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.schedulesService.createWithSimulatedRollback(
      createScheduleDto,
      userId,
    );
  }

  @Patch(':id')
  @UseGuards(ScheduleOwnershipGuard)
  @ApiUpdateScheduleDoc()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(
      id,
      updateScheduleDto,
    );
  }

  @Patch(':id/status')
  @UseGuards(ScheduleOwnershipGuard)
  @ApiUpdateScheduleStatusDoc()
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateScheduleStatusDto: UpdateScheduleStatusDto,
  ) {
    return this.schedulesService.updateStatus(
      id,
      updateScheduleStatusDto,
    );
  }

  @Delete(':id')
  @UseGuards(ScheduleOwnershipGuard)
  @ApiRemoveScheduleDoc()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.remove(id);
  }
}
