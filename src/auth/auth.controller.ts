import { Body, Controller, Post } from "@nestjs/common";
import { Public } from "./auth.decorator.js";
import { AuthService, LoginDto } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
