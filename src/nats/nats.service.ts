import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { connect, JSONCodec, NatsConnection } from "nats";

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
  private connection?: NatsConnection;
  private readonly codec = JSONCodec<unknown>();

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const servers = this.config.get<string>("NATS_URL") ?? "nats://localhost:4222";
    this.connection = await connect({ servers });
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.drain();
  }

  publish(subject: string, payload: unknown): void {
    if (!this.connection) {
      throw new Error("NATS is not initialized");
    }

    this.connection.publish(subject, this.codec.encode(payload));
  }
}
