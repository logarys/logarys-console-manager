import { Injectable } from "@nestjs/common";
import { MongoService } from "../mongo/mongo.service.js";
import { ObjectId } from "mongodb";

export interface PipelineConfig {
  _id?: ObjectId;
  name: string;
  enabled: boolean;
  source?: string;
  parser?: string;
  rules?: unknown[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class ConfigManagementService {
  constructor(private readonly mongo: MongoService) {}

  async listPipelines(): Promise<PipelineConfig[]> {
    return this.mongo.collection<PipelineConfig>("pipelines").find({}).sort({ name: 1 }).toArray();
  }

  async createPipeline(input: Omit<PipelineConfig, "createdAt" | "updatedAt">): Promise<PipelineConfig> {
    const pipeline: PipelineConfig = {
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.mongo.collection<PipelineConfig>("pipelines").insertOne(pipeline);
    return { ...pipeline, _id: result.insertedId };
  }
}
