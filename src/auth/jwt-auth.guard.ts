import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_ROUTE } from "./auth.decorator.js";
import { JwtService, JwtUserPayload } from "./jwt.service.js";
import { UsersService } from "../users/users.service.js";

interface AuthenticatedHttpRequest {
  headers: {
    authorization?: string;
  };
  user?: JwtUserPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedHttpRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authorization.slice("Bearer ".length);

    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user.isEnabled) {
        throw new UnauthorizedException("User is disabled");
      }

      request.user = {
        sub: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("Invalid bearer token");
    }
  }
}
