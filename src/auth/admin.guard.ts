import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

interface AdminHttpRequest {
  user?: {
    isAdmin: boolean;
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AdminHttpRequest>();

    if (!request.user?.isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    return true;
  }
}
