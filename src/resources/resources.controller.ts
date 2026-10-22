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
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/users/enums/role.enum';
import {
  ApiCreateResourceDoc,
  ApiFindAllResourcesDoc,
  ApiFindOneResourceDoc,
  ApiRemoveResourceDoc,
  ApiResourcesTagDoc,
  ApiUpdateResourceDoc,
} from 'src/swagger/docs/resources.doc';

@ApiResourcesTagDoc()
@Controller('resources')
export class ResourcesController {
  constructor(
    private readonly resourcesService: ResourcesService,
  ) {}

  @Get()
  @ApiFindAllResourcesDoc()
  findAll(@Query() query: QueryResourceDto) {
    return this.resourcesService.findAll(query);
  }

  @Get(':id')
  @ApiFindOneResourceDoc()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.resourcesService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiCreateResourceDoc()
  create(@Body() createResourceDto: CreateResourceDto) {
    return this.resourcesService.create(createResourceDto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @ApiUpdateResourceDoc()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResourceDto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(
      id,
      updateResourceDto,
    );
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiRemoveResourceDoc()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.resourcesService.remove(id);
  }
}
