import { Document, Model, PopulateOptions } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { APIFeatures } from '@shared/utils/api-features';
import { FactoryService } from './factory.service';

/**
 * Template Method: shared CRUD for feature services.
 * DIP: FactoryService is injected (never constructed with `new`).
 */
@Injectable()
export abstract class BaseService<T extends Document> {
  constructor(
    protected readonly model: Model<T>,
    protected readonly factoryService: FactoryService,
  ) {}

  // Using any for createDto to allow flexibility in derived services
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(createDto: any): Promise<T> {
    const doc = await this.factoryService.create(this.model, createDto);
    return doc;
  }

  async findById(id: string, popOptions?: PopulateOptions | PopulateOptions[]): Promise<T> {
    const options: Record<string, unknown> = {};

    if (popOptions) {
      options.populate = popOptions;
    }

    const doc = await this.factoryService.findById(this.model, id, options);

    if (!doc) {
      throw new NotFoundException('Document not found with that ID');
    }

    return doc;
  }

  // Using any for queryString to accept any query parameters
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findAll(
    queryString: any,
    popOptions?: PopulateOptions | PopulateOptions[],
  ): Promise<{
    data: T[];
    meta: {
      results: number;
      limit: number;
      currentPage: number;
      totalPages: number;
      totalCount: number;
    };
  }> {
    const features = new APIFeatures(this.model, queryString, this.factoryService)
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .search();

    if (popOptions) {
      features.populate(popOptions);
    }

    await features.calculateTotalCount();
    const doc = await features.execute();

    return {
      data: doc,
      meta: {
        results: doc.length,
        limit: features.getLimit(),
        currentPage: features.getCurrentPage(),
        totalPages: features.getTotalPages(),
        totalCount: features.totalCount,
      },
    };
  }

  // Using any for updateDto to allow partial updates with any fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async update(id: string, updateDto: any): Promise<T> {
    const doc = await this.factoryService.findById(this.model, id);

    if (!doc) {
      throw new NotFoundException('Document not found with that ID');
    }

    Object.assign(doc, updateDto);
    // Keep schema validation on (LSP: subclasses inherit a sound contract)
    await doc.save();

    return doc;
  }

  async delete(id: string): Promise<void> {
    const doc = await this.factoryService.findByIdAndDelete(this.model, id);

    if (!doc) {
      throw new NotFoundException('Document not found with that ID');
    }
  }
}
