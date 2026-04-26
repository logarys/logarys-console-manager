import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { MongoService } from "../mongo/mongo.service.js";
import { PasswordService } from "../auth/password.service.js";
import { toSafeUser, User } from "./user.entity.js";

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  isEnabled?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  isAdmin?: boolean;
  isEnabled?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly mongo: MongoService) {}

  private collection() {
    return this.mongo.collection<User>("users");
  }

  async ensureIndexes(): Promise<void> {
    await this.collection().createIndex({ id: 1 }, { unique: true });
    await this.collection().createIndex({ email: 1 }, { unique: true });
  }

  async list() {
    const users = await this.collection().find({}).sort({ name: 1 }).toArray();

    return users.map(toSafeUser);
  }

  async findById(id: string) {
    const user = await this.collection().findOne({ id });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.collection().findOne({ email: email.toLowerCase() });
  }

  async create(dto: CreateUserDto) {
    this.validateCreate(dto);

    const email = dto.email.toLowerCase();
    const existing = await this.findByEmail(email);

    if (existing) {
      throw new ConflictException("Email already exists");
    }

    const now = new Date();
    const user: User = {
      id: randomUUID(),
      name: dto.name.trim(),
      email,
      password: await PasswordService.hash(dto.password),
      isAdmin: dto.isAdmin ?? false,
      isEnabled: dto.isEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    } as User;

    await this.collection().insertOne(user);

    return toSafeUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const current = await this.findById(id);
    const update: Partial<User> = { updatedAt: new Date() };

    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw new BadRequestException("Name is required");
      }

      update.name = dto.name.trim();
    }

    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase().trim();

      if (!this.isValidEmail(email)) {
        throw new BadRequestException("Invalid email");
      }

      const existing = await this.findByEmail(email);

      if (existing && existing.id !== id) {
        throw new ConflictException("Email already exists");
      }

      update.email = email;
    }

    if (dto.password !== undefined) {
      this.validatePassword(dto.password);
      update.password = await PasswordService.hash(dto.password);
    }

    if (dto.isAdmin !== undefined) {
      update.isAdmin = dto.isAdmin;
    }

    if (dto.isEnabled !== undefined) {
      update.isEnabled = dto.isEnabled;
    }

    await this.collection().updateOne({ id: current.id }, { $set: update });

    const updated = await this.findById(id);

    return toSafeUser(updated);
  }

  async updatePasswordByEmail(email: string, password: string) {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.update(user.id, { password });
  }

  async disable(id: string) {
    return this.update(id, { isEnabled: false });
  }

  async delete(id: string) {
    await this.findById(id);
    await this.collection().deleteOne({ id });

    return { deleted: true };
  }

  private validateCreate(dto: CreateUserDto): void {
    if (!dto.name?.trim()) {
      throw new BadRequestException("Name is required");
    }

    if (!this.isValidEmail(dto.email)) {
      throw new BadRequestException("Invalid email");
    }

    this.validatePassword(dto.password);
  }

  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new BadRequestException("Password must contain at least 8 characters");
    }
  }

  private isValidEmail(email?: string): boolean {
    return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
