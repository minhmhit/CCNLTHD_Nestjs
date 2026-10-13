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
import { QueryResourceDto } from './dto/query-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourcesRepository: Repository<Resource>,
  ) {}

  async findAll(query?: QueryResourceDto) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder =
      this.resourcesRepository.createQueryBuilder(
        'resource',
      );

    if (query?.name) {
      queryBuilder.andWhere('resource.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    if (query?.minCapacity) {
      queryBuilder.andWhere(
        'resource.capacity >= :minCapacity',
        {
          minCapacity: query.minCapacity,
        },
      );
    }

    if (query?.maxCapacity) {
      queryBuilder.andWhere(
        'resource.capacity <= :maxCapacity',
        {
          maxCapacity: query.maxCapacity,
        },
      );
    }

    if (query?.isActive !== undefined) {
      queryBuilder.andWhere(
        'resource.isActive = :isActive',
        {
          isActive: query.isActive,
        },
      );
    }

    queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('resource.id', 'ASC');

    const [items, total] =
      await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
