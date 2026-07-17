import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from '@shared/services/base.service';
import { DocumentDao } from '@shared/services/document-dao.service';
import { Item, ItemDocument } from '../schema/item.schema';
import { CreateItemDto } from '../dtos/create-item.dto';
import { UpdateItemDto } from '../dtos/update-item.dto';

@Injectable()
export class ItemsService extends BaseService<ItemDocument> {
  constructor(
    @InjectModel(Item.name) private readonly itemModel: Model<ItemDocument>,
    documentDao: DocumentDao,
  ) {
    super(itemModel, documentDao);
  }

  async createItem(dto: CreateItemDto, userId: string): Promise<ItemDocument> {
    return this.create({
      ...dto,
      createdBy: userId,
    });
  }

  async findAllItems(query: Record<string, string>) {
    return this.findAll(query, [{ path: 'createdBy', select: 'name email' }]);
  }

  async findItemById(id: string): Promise<ItemDocument> {
    return this.findById(id, [{ path: 'createdBy', select: 'name email' }]);
  }

  async updateItem(id: string, dto: UpdateItemDto): Promise<ItemDocument> {
    return this.update(id, dto);
  }

  async deleteItem(id: string): Promise<void> {
    await this.delete(id);
  }
}
