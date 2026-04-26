import { Module } from "@nestjs/common";
import { MongoModule } from "../mongo/mongo.module.js";
import { UsersController } from "./users.controller.js";
import { UsersInitService } from "./users-init.service.js";
import { UsersService } from "./users.service.js";

@Module({
  imports: [MongoModule],
  controllers: [UsersController],
  providers: [UsersService, UsersInitService],
  exports: [UsersService],
})
export class UsersModule {}
