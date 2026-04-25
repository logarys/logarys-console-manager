import { Body, Controller, Post } from "@nestjs/common";
import { QueryService } from "./query.service.js";

@Controller("query")
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post("convert")
  convert(@Body() body: { language?: string; target?: string; query: string }) {
    return this.queryService.convert(body.language ?? "rsql", body.target ?? "mongodb", body.query);
  }
}
