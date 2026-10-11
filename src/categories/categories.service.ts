import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async findOne(id: number) {
    return await this.categoriesRepository.findOne({
      where: { id },
    });
  }

  create(_createCategoryDto: CreateCategoryDto) {
    void _createCategoryDto;
    return 'This action adds a new category';
  }

  findAll() {
    return `This action returns all categories`;
  }

  update(
    id: number,
    _updateCategoryDto: UpdateCategoryDto,
  ) {
    void _updateCategoryDto;
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
