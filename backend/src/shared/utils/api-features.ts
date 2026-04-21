import { Document, FilterQuery, Model, PopulateOptions } from 'mongoose';
import { Types } from 'mongoose';
import { FactoryService } from '@shared/services/factory.service';

interface QueryString {
  [key: string]: string | string[];
}

export class APIFeatures<T extends Document> {
  private model: Model<T>;
  private queryString: QueryString;
  private filterQuery: FilterQuery<T> = {};
  // Using any for sort options to accept dynamic sort fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sortOptions: any = { createdAt: -1 };
  private selectFields: string = '-__v';
  private populateOptions: PopulateOptions[] = [];
  private skipValue = 0;
  private limitValue = 100;
  public totalCount = 0;
  private factoryService: FactoryService;

  constructor(model: Model<T>, queryString: QueryString) {
    this.model = model;
    this.queryString = queryString;
    this.factoryService = new FactoryService();
  }

  private excludeFieldsAndParseQuery(): FilterQuery<T> {
    // Using any for queryObj to handle dynamic query parameters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryObj: any = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'searchFields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Handle empty parameters
    Object.keys(queryObj).forEach((key) => {
      if (queryObj[key] === '' || queryObj[key] === undefined) {
        queryObj[key] = { $exists: true, $ne: null };
      }
    });

    // Advanced filtering with operators
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    return JSON.parse(queryStr);
  }

  private inferTypeFromFieldName(fieldName: string): string {
    const name = fieldName.toLowerCase();

    if (name.includes('id') || name === '_id' || name.endsWith('id') || name.endsWith('_id')) {
      return 'ObjectId';
    }

    if (
      name.includes('price') ||
      name.includes('cost') ||
      name.includes('amount') ||
      name.includes('total') ||
      name.includes('quantity') ||
      name === 'age' ||
      name === 'count'
    ) {
      return 'Number';
    }

    if (
      name.includes('is') ||
      name.includes('has') ||
      name.includes('can') ||
      name.includes('active') ||
      name.includes('enabled')
    ) {
      return 'Boolean';
    }

    return 'String';
  }

  async calculateTotalCount(): Promise<this> {
    this.totalCount = await this.factoryService.countDocuments(this.model, this.filterQuery);
    return this;
  }

  filter(): this {
    this.filterQuery = this.excludeFieldsAndParseQuery();
    return this;
  }

  sort(): this {
    if (this.queryString.sort) {
      const sortBy = (this.queryString.sort as string).split(',').join(' ');
      this.sortOptions = sortBy;
    }
    return this;
  }

  search(): this {
    if (this.queryString.search && this.queryString.searchFields) {
      const searchValue = this.queryString.search as string;

      let searchFields: string[];
      try {
        searchFields = JSON.parse(this.queryString.searchFields as string);
      } catch (error) {
        searchFields = (this.queryString.searchFields as string).split(',');
      }

      const isValidObjectId = Types.ObjectId.isValid(searchValue);
      const searchRegex = new RegExp(searchValue, 'i');
      const searchCriteria: FilterQuery<T>[] = [];

      searchFields.forEach((field) => {
        const fieldName = field.trim();

        const getFieldType = (fieldPath: string) => {
          try {
            const schemaType = this.model.schema.path(fieldPath);
            if (!schemaType) return 'unknown';

            const typeName = schemaType.constructor.name;

            switch (typeName) {
              case 'SchemaObjectId':
                return 'ObjectId';
              case 'SchemaNumber':
                return 'Number';
              case 'SchemaBoolean':
                return 'Boolean';
              case 'SchemaDate':
                return 'Date';
              case 'SchemaString':
              default:
                return 'String';
            }
          } catch (error) {
            return this.inferTypeFromFieldName(fieldPath);
          }
        };

        const fieldType = getFieldType(fieldName);

        switch (fieldType) {
          case 'ObjectId':
            if (isValidObjectId) {
              try {
                searchCriteria.push({
                  [fieldName]: new Types.ObjectId(searchValue),
                } as FilterQuery<T>);
              } catch (error) {
                // Skip invalid ObjectId
              }
            }
            break;

          case 'Number':
            const numericValue = parseFloat(searchValue);
            if (!isNaN(numericValue)) {
              searchCriteria.push({ [fieldName]: numericValue } as FilterQuery<T>);
            }
            break;

          case 'Boolean':
            const lowerSearchValue = searchValue.toLowerCase().trim();
            if (['true', '1', 'yes'].includes(lowerSearchValue)) {
              searchCriteria.push({ [fieldName]: true } as FilterQuery<T>);
            } else if (['false', '0', 'no'].includes(lowerSearchValue)) {
              searchCriteria.push({ [fieldName]: false } as FilterQuery<T>);
            }
            break;

          case 'Date':
            const dateValue = new Date(searchValue);
            if (!isNaN(dateValue.getTime())) {
              searchCriteria.push({ [fieldName]: dateValue } as FilterQuery<T>);
            }
            break;

          case 'String':
          default:
            searchCriteria.push({ [fieldName]: searchRegex } as FilterQuery<T>);
            break;
        }
      });

      if (searchCriteria.length > 0) {
        const filteredQuery = this.excludeFieldsAndParseQuery();
        this.filterQuery = {
          $and: [filteredQuery, { $or: searchCriteria }],
        } as FilterQuery<T>;
      }
    }

    return this;
  }

  limitFields(): this {
    if (this.queryString.fields) {
      this.selectFields = (this.queryString.fields as string).split(',').join(' ');
    }
    return this;
  }

  paginate(): this {
    const page = parseInt(this.queryString.page as string, 10) || 1;
    this.limitValue = parseInt(this.queryString.limit as string, 10) || 100;
    this.skipValue = (page - 1) * this.limitValue;
    return this;
  }

  populate(options: PopulateOptions | PopulateOptions[]): this {
    if (Array.isArray(options)) {
      this.populateOptions.push(...options);
    } else {
      this.populateOptions.push(options);
    }
    return this;
  }

  async execute(): Promise<T[]> {
    let query = this.model
      .find(this.filterQuery)
      .sort(this.sortOptions)
      .select(this.selectFields)
      .skip(this.skipValue)
      .limit(this.limitValue);

    if (this.populateOptions.length > 0) {
      this.populateOptions.forEach((option) => {
        query = query.populate(option);
      });
    }

    return query.exec();
  }

  getLimit(): number {
    return this.limitValue;
  }

  getCurrentPage(): number {
    return parseInt(this.queryString.page as string, 10) || 1;
  }

  getTotalPages(): number {
    return Math.ceil(this.totalCount / this.limitValue);
  }
}
