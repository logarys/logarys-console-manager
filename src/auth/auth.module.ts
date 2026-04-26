import { Module, forwardRef } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { UsersModule } from "../users/users.module.js";
import { AdminGuard } from "./admin.guard.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { JwtService } from "./jwt.service.js";

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    AdminGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, JwtService, AdminGuard],
})
export class AuthModule {}
