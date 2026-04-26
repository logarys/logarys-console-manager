import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard.js";
import { LoadTestDataRequest, TestDataService } from "./test-data.service.js";

@Controller()
@UseGuards(AdminGuard)
export class TestDataController {
  constructor(private readonly service: TestDataService) {}

  @Post(["test-data", "api/test-data", "dev/test-data", "api/dev/test-data"])
  load(@Body() body: LoadTestDataRequest = {}) {
    return this.service.load(body);
  }
}
