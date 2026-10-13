import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from './entities/resource.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(
    ResourcesService.name,
  );

  constructor(
    @InjectRepository(Resource)
    private readonly resourcesRepository: Repository<Resource>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async findAll(query?: QueryResourceDto) {
    const isDefaultQuery =
      !query ||
      (!query.name &&
        !query.minCapacity &&
        !query.maxCapacity &&
        query.isActive === undefined &&
        (!query.page || query.page === 1) &&
        (!query.limit || query.limit === 10));

    if (isDefaultQuery) {
      const cachedData =
        await this.cacheManager.get('resources_all');
      if (cachedData) {
        this.logger.log('[Cache HIT] resources_all');
        return cachedData;
      }
      this.logger.log('[Cache MISS] resources_all');
    }

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

    const result = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    if (isDefaultQuery) {
      await this.cacheManager.set(
        'resources_all',
        result,
        60000,
      );
    }

    return result;
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
    const saved =
      await this.resourcesRepository.save(resource);

    await this.cacheManager.del('resources_all');
    this.logger.log(
      '[Cache INVALIDATED] resources_all key purged due to mutation',
    );

    return saved;
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
    const updated =
      await this.resourcesRepository.save(resource);

    await this.cacheManager.del('resources_all');
    this.logger.log(
      '[Cache INVALIDATED] resources_all key purged due to mutation',
    );

    return updated;
  }

  async remove(id: number): Promise<{ message: string }> {
    const resource = await this.findOne(id);
    await this.resourcesRepository.remove(resource);

    await this.cacheManager.del('resources_all');
    this.logger.log(
      '[Cache INVALIDATED] resources_all key purged due to mutation',
    );

    return {
      message: `Đã xóa tài nguyên "${resource.name}" thành công!`,
    };
  }
}
