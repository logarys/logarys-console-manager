import { Body, Controller, Post } from "@nestjs/common";
import { LoadTestDataRequest, TestDataService } from "./test-data.service.js";

@Controller()
export class TestDataController {
  constructor(private readonly service: TestDataService) {}

  @Post(["test-data", "api/test-data", "dev/test-data", "api/dev/test-data"])
  load(@Body() body: LoadTestDataRequest = {}) {
    return this.service.load(body);
  }
}
