import { ObjectId } from "mongodb";

export interface LogDocument {
  pipelineId?: string;
  _id?: ObjectId;
  timestamp: Date;
  level: string;
  host?: string;
  source?: string;
  service?: string;
  environment?: string;
  message?: string;
  normalizedMessage?: string;
  errorType?: string;
  errorCode?: string;
  tags?: string[];
  context?: Record<string, unknown>;
  raw?: unknown;
}