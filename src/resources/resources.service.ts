import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from './entities/resource.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourcesRepository: Repository<Resource>,
  ) {}

  async findAll(): Promise<Resource[]> {
    return this.resourcesRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Resource> {
    const resource = await this.resourcesRepository.findOne(
      {
        where: { id },
      },
    );
    if (!resource) {
      throw new NotFoundException(
        `Không tìm thấy tài nguyên với ID = ${id}`,
      );
    }
    return resource;
  }

  async create(
    createResourceDto: CreateResourceDto,
  ): Promise<Resource> {
    const existing = await this.resourcesRepository.findOne(
      {
        where: { name: createResourceDto.name },
      },
    );
    if (existing) {
      throw new ConflictException(
        'Tên tài nguyên đã tồn tại!',
      );
    }

    const resource = this.resourcesRepository.create(
      createResourceDto,
    );
    return this.resourcesRepository.save(resource);
  }

  async update(
    id: number,
    updateResourceDto: UpdateResourceDto,
  ): Promise<Resource> {
    const resource = await this.findOne(id);

    if (
      updateResourceDto.name &&
      updateResourceDto.name !== resource.name
    ) {
      const existing =
        await this.resourcesRepository.findOne({
          where: { name: updateResourceDto.name },
        });
      if (existing) {
        throw new ConflictException(
          'Tên tài nguyên đã tồn tại!',
        );
      }
    }

    Object.assign(resource, updateResourceDto);
    return this.resourcesRepository.save(resource);
  }

  async remove(id: number): Promise<{ message: string }> {
    const resource = await this.findOne(id);
    await this.resourcesRepository.remove(resource);
    return {
      message: `Đã xóa tài nguyên "${resource.name}" thành công!`,
    };
  }
}
