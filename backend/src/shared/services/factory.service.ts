import { Injectable } from '@nestjs/common';
import mongoose from 'mongoose';

/**
 * Generic data-access helper (Repository-style DAO).
 * Prefer injecting this via Nest DI — do not treat as a GoF Factory.
 */
@Injectable()
export class FactoryService {
  /**
   * Create a new document
   * @param {mongoose.Model} Model
   * @param {object} data
   * @param {object} select
   * @returns {Promise<any>}
   */
  async create(Model: mongoose.Model<any>, data: any, select: any = {}) {
    const document = new Model(data);
    await document.save();

    if (Object.keys(select).length > 0) {
      return document.toObject({
        versionKey: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transform: (doc: any, ret: any) => {
          const result: any = {};
          Object.keys(select).forEach((key) => {
            if (select[key] && ret[key] !== undefined) {
              result[key] = ret[key];
            }
          });
          return result;
        },
      });
    }

    return document;
  }

  /**
   * Find one document
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @param {object} options
   * @returns {Promise<any>}
   */
  async findOne(Model: mongoose.Model<any>, filter: any, options: any = {}) {
    let query = Model.findOne(filter);

    if (options.select) {
      query = query.select(options.select);
    }

    if (options.populate) {
      query = query.populate(options.populate);
    }

    return query.exec();
  }

  /**
   * Find many documents
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @param {object} options
   * @returns {Promise<any[]>}
   */
  async findMany(Model: mongoose.Model<any>, filter: any, options: any = {}) {
    let query = Model.find(filter);

    if (options.select) {
      query = query.select(options.select);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.skip) {
      query = query.skip(options.skip);
    }

    if (options.sort) {
      query = query.sort(options.sort);
    }

    if (options.populate) {
      query = query.populate(options.populate);
    }

    return query.exec();
  }

  /**
   * Delete many documents
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @returns {Promise<any>}
   */
  async deleteMany(Model: mongoose.Model<any>, filter: any) {
    return Model.deleteMany(filter).exec();
  }

  /**
   * Update one document
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @param {object} update
   * @param {object} options
   * @returns {Promise<any>}
   */
  async updateOne(Model: mongoose.Model<any>, filter: any, update: any, options: any = {}) {
    return Model.findOneAndUpdate(filter, update, { new: true, ...options }).exec();
  }

  /**
   * Count documents
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @returns {Promise<number>}
   */
  async count(Model: mongoose.Model<any>, filter: any) {
    return Model.countDocuments(filter).exec();
  }

  /**
   * Execute aggregation pipeline
   * @param {mongoose.Model} Model
   * @param {object[]} pipeline
   * @returns {Promise<any[]>}
   */
  async aggregate(Model: mongoose.Model<any>, pipeline: any[]) {
    return Model.aggregate(pipeline).exec();
  }

  /**
   * Find by ID
   * @param {mongoose.Model} Model
   * @param {string} id
   * @param {object} options
   * @returns {Promise<any>}
   */
  async findById(Model: mongoose.Model<any>, id: string, options: any = {}) {
    let query = Model.findById(id);

    if (options.select) {
      query = query.select(options.select);
    }

    if (options.populate) {
      query = query.populate(options.populate);
    }

    return query.exec();
  }

  /**
   * Find one and delete
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @returns {Promise<any>}
   */
  async findOneAndDelete(Model: mongoose.Model<any>, filter: any) {
    return Model.findOneAndDelete(filter).exec();
  }

  /**
   * Find by ID and delete
   * @param {mongoose.Model} Model
   * @param {string} id
   * @returns {Promise<any>}
   */
  async findByIdAndDelete(Model: mongoose.Model<any>, id: string) {
    return Model.findByIdAndDelete(id).exec();
  }

  /**
   * Find by ID and update
   * @param {mongoose.Model} Model
   * @param {string} id
   * @param {object} update
   * @param {object} options
   * @returns {Promise<any>}
   */
  async findByIdAndUpdate(Model: mongoose.Model<any>, id: string, update: any, options: any = {}) {
    return Model.findByIdAndUpdate(id, update, { new: true, ...options }).exec();
  }

  /**
   * Update many documents
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @param {object} update
   * @param {object} options
   * @returns {Promise<any>}
   */
  async updateMany(Model: mongoose.Model<any>, filter: any, update: any, options: any = {}) {
    return Model.updateMany(filter, update, options).exec();
  }

  /**
   * Delete one document
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @returns {Promise<any>}
   */
  async deleteOne(Model: mongoose.Model<any>, filter: any) {
    return Model.deleteOne(filter).exec();
  }

  /**
   * Create many documents
   * @param {mongoose.Model} Model
   * @param {array} data
   * @param {object} options
   * @returns {Promise<any[]>}
   */
  async createMany(Model: mongoose.Model<any>, data: any[], options: any = {}) {
    return Model.insertMany(data, options);
  }

  /**
   * Count documents (alias for count)
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @returns {Promise<number>}
   */
  async countDocuments(Model: mongoose.Model<any>, filter: any = {}) {
    return Model.countDocuments(filter).exec();
  }

  /**
   * Estimated document count (faster but less accurate)
   * @param {mongoose.Model} Model
   * @returns {Promise<number>}
   */
  async estimatedDocumentCount(Model: mongoose.Model<any>) {
    return Model.estimatedDocumentCount().exec();
  }

  /**
   * Find one and update (upsert support)
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @param {object} update
   * @param {object} options
   * @returns {Promise<any>}
   */
  async findOneAndUpdate(Model: mongoose.Model<any>, filter: any, update: any, options: any = {}) {
    return Model.findOneAndUpdate(filter, update, { new: true, ...options }).exec();
  }

  /**
   * Find one and replace
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @param {object} replacement
   * @param {object} options
   * @returns {Promise<any>}
   */
  async findOneAndReplace(
    Model: mongoose.Model<any>,
    filter: any,
    replacement: any,
    options: any = {},
  ) {
    return Model.findOneAndReplace(filter, replacement, { new: true, ...options }).exec();
  }

  /**
   * Bulk write operations
   * @param {mongoose.Model} Model
   * @param {array} operations
   * @param {object} options
   * @returns {Promise<any>}
   */
  async bulkWrite(Model: mongoose.Model<any>, operations: any[], options: any = {}) {
    return Model.bulkWrite(operations, options);
  }

  /**
   * Distinct values
   * @param {mongoose.Model} Model
   * @param {string} field
   * @param {object} filter
   * @returns {Promise<any[]>}
   */
  async distinct(Model: mongoose.Model<any>, field: string, filter: any = {}) {
    return Model.distinct(field, filter).exec();
  }

  /**
   * Check if document exists
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @returns {Promise<boolean>}
   */
  async exists(Model: mongoose.Model<any>, filter: any) {
    const doc = await Model.exists(filter);
    return !!doc;
  }

  /**
   * Find with pagination
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @param {object} options
   * @returns {Promise<{data: any[], total: number, page: number, limit: number}>}
   */
  async paginate(Model: mongoose.Model<any>, filter: any = {}, options: any = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 }, select, populate } = options;

    const skip = (page - 1) * limit;

    let query = Model.find(filter).sort(sort).skip(skip).limit(limit);

    if (select) {
      query = query.select(select);
    }

    if (populate) {
      query = query.populate(populate);
    }

    const [data, total] = await Promise.all([query.exec(), Model.countDocuments(filter).exec()]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Find one or create
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @param {object} data
   * @returns {Promise<{doc: any, created: boolean}>}
   */
  async findOneOrCreate(Model: mongoose.Model<any>, filter: any, data: any) {
    let doc = await Model.findOne(filter).exec();
    let created = false;

    if (!doc) {
      doc = await Model.create(data);
      created = true;
    }

    return { doc, created };
  }

  /**
   * Soft delete (set deleted flag instead of removing)
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @returns {Promise<any>}
   */
  async softDelete(Model: mongoose.Model<any>, filter: any) {
    return Model.findOneAndUpdate(
      filter,
      { deleted: true, deletedAt: new Date() },
      { new: true },
    ).exec();
  }

  /**
   * Restore soft deleted document
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @returns {Promise<any>}
   */
  async restore(Model: mongoose.Model<any>, filter: any) {
    return Model.findOneAndUpdate(
      filter,
      { deleted: false, deletedAt: null },
      { new: true },
    ).exec();
  }

  /**
   * Execute a transaction
   * @param {Function} callback - Function that receives session and executes operations
   * @returns {Promise<any>}
   */
  async transaction(callback: (session: mongoose.ClientSession) => Promise<any>) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Find with lean (returns plain JavaScript objects)
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @param {object} options
   * @returns {Promise<any[]>}
   */
  async findLean(Model: mongoose.Model<any>, filter: any, options: any = {}) {
    let query = Model.find(filter).lean();

    if (options.select) {
      query = query.select(options.select);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.skip) {
      query = query.skip(options.skip);
    }

    if (options.sort) {
      query = query.sort(options.sort);
    }

    if (options.populate) {
      query = query.populate(options.populate);
    }

    return query.exec();
  }

  /**
   * Find one with lean
   * @param {mongoose.Model} Model
   * @param {object} filter
   * @param {object} options
   * @returns {Promise<any>}
   */
  async findOneLean(Model: mongoose.Model<any>, filter: any, options: any = {}) {
    let query = Model.findOne(filter).lean();

    if (options.select) {
      query = query.select(options.select);
    }

    if (options.populate) {
      query = query.populate(options.populate);
    }

    return query.exec();
  }
}
