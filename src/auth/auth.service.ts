import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PasswordService } from "./password.service.js";
import { JwtService } from "./jwt.service.js";
import { UsersService } from "../users/users.service.js";
import { toSafeUser } from "../users/user.entity.js";

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.isEnabled) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const validPassword = await PasswordService.verify(dto.password, user.password);

    if (!validPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      }),
      user: toSafeUser(user),
    };
  }
}
