import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { NatsService } from "../nats/nats.service.js";

export interface MaintenanceCommand {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  requestedAt: string;
}

@Injectable()
export class MaintenanceService {
  constructor(private readonly nats: NatsService) {}

  sendCommand(type: string, payload: Record<string, unknown> = {}): MaintenanceCommand {
    const command: MaintenanceCommand = {
      id: randomUUID(),
      type,
      payload,
      requestedAt: new Date().toISOString(),
    };

    this.nats.publish("logarys.maintenance.commands", command);
    return command;
  }
}
