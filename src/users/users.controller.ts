import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard.js";
import { toSafeUser } from "./user.entity.js";
import { CreateUserDto, UpdateUserDto, UsersService } from "./users.service.js";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AdminGuard)
  list() {
    return this.usersService.list();
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get("me")
  async me(@Req() request: { user: { sub: string } }) {
    const user = await this.usersService.findById(request.user.sub);

    return toSafeUser(user);
  }

  @Patch("me")
  updateMe(@Req() request: { user: { sub: string } }, @Body() dto: UpdateUserDto) {
    return this.usersService.update(request.user.sub, {
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
  }

  @Patch(":id")
  @UseGuards(AdminGuard)
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(":id/disable")
  @UseGuards(AdminGuard)
  disable(@Param("id") id: string) {
    return this.usersService.disable(id);
  }

  @Delete(":id")
  @UseGuards(AdminGuard)
  delete(@Param("id") id: string) {
    return this.usersService.delete(id);
  }
}
