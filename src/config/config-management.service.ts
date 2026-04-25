import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Filter, ObjectId } from "mongodb";
import { MongoService } from "../mongo/mongo.service.js";

export interface PipelineConfig {
  _id?: ObjectId;
  id?: string;
  name: string;
  enabled: boolean;
  inputType?: string;
  description?: string;
  source?: string;
  parser?: string;
  config?: Record<string, unknown>;
  rules?: unknown[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PipelineSearchParams {
  query?: string;
  name?: string;
  inputType?: string;
  enabled?: string | boolean;
  limit?: number;
  skip?: number;
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseBoolean(value: string | boolean | undefined): boolean | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (["true", "1", "yes", "enabled"].includes(value.toLowerCase())) {
    return true;
  }

  if (["false", "0", "no", "disabled"].includes(value.toLowerCase())) {
    return false;
  }

  throw new BadRequestException(`Invalid enabled value: ${value}`);
}

@Injectable()
export class ConfigManagementService {
  constructor(private readonly mongo: MongoService) {}

  async listPipelines(params: PipelineSearchParams = {}): Promise<PipelineConfig[]> {
    const filter: Filter<PipelineConfig> = {};
    const search = params.query ?? params.name;
    const enabled = parseBoolean(params.enabled);

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { id: regex }, { description: regex }];
    }

    if (params.inputType) {
      filter.inputType = params.inputType;
    }

    if (enabled !== undefined) {
      filter.enabled = enabled;
    }

    return this.mongo
      .collection<PipelineConfig>("pipelines")
      .find(filter)
      .sort({ name: 1 })
      .skip(params.skip ?? 0)
      .limit(params.limit ?? 100)
      .toArray();
  }

  async createPipeline(input: Omit<PipelineConfig, "_id" | "createdAt" | "updatedAt">): Promise<PipelineConfig> {
    if (!input.name?.trim()) {
      throw new BadRequestException("Pipeline name is required");
    }

    const now = new Date();
    const id = input.id?.trim() || normalizeSlug(input.name);

    if (!id) {
      throw new BadRequestException("Pipeline id could not be generated from name");
    }

    const pipeline: PipelineConfig = {
      ...input,
      id,
      name: input.name.trim(),
      enabled: input.enabled ?? true,
      inputType: input.inputType ?? "http",
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.mongo.collection<PipelineConfig>("pipelines").insertOne(pipeline);
    return { ...pipeline, _id: result.insertedId };
  }

  async getPipeline(id: string): Promise<PipelineConfig> {
    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { id }, { name: id }] }
      : { $or: [{ id }, { name: id }] };

    const pipeline = await this.mongo.collection<PipelineConfig>("pipelines").findOne(filter);

    if (!pipeline) {
      throw new NotFoundException(`Pipeline not found: ${id}`);
    }

    return pipeline;
  }
}
