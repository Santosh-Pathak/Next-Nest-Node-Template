import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schema/userSchema';
import { BaseService } from '@shared/services/base.service';
import { FactoryService } from '@shared/services/factory.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

@Injectable()
export class UsersService extends BaseService<UserDocument> {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    factoryService: FactoryService,
  ) {
    super(userModel);
    this.factoryService = factoryService;
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    return this.create(createUserDto);
  }

  async findUserById(id: string): Promise<UserDocument> {
    return this.findById(id);
  }

  // Using any for queryString to accept flexible query parameters from base service
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findAllUsers(queryString: any) {
    return this.findAll(queryString);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    return this.update(id, updateUserDto);
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete(id);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.factoryService.findOne(this.userModel, { email }, { select: '+password' });
  }
}
