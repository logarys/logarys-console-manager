import { Injectable, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { Collection, Db, Document, Filter, MongoClient } from "mongodb";

@Injectable()
export class MongoService implements OnModuleInit, OnApplicationShutdown {
  private client!: MongoClient;
  private db!: Db;

  async onModuleInit(): Promise<void> {
    const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
    const database = process.env.MONGODB_DATABASE ?? "logarys";

    this.client = new MongoClient(uri);
    await this.client.connect();

    this.db = this.client.db(database);
  }

  collection<TSchema extends Document = Document>(
    name: string,
  ): Collection<TSchema> {
    return this.db.collection<TSchema>(name);
  }

  async listCollectionNames(filter: Filter<Document> = {}): Promise<string[]> {
    const collections = await this.db.listCollections(filter, { nameOnly: true }).toArray();

    return collections.map((collection) => collection.name);
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
  }
}