import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { UsersService } from "./users.service.js";

@Injectable()
export class UsersInitService implements OnApplicationBootstrap {
  constructor(private readonly usersService: UsersService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.usersService.ensureIndexes();
    await this.ensureFirstAdmin();
  }

  private async ensureFirstAdmin(): Promise<void> {
    if (process.env.ADMIN_INIT_ENABLED !== "true") {
      return;
    }

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME ?? "Administrator";

    if (!email || !password) {
      console.warn("ADMIN_INIT_ENABLED=true but ADMIN_EMAIL or ADMIN_PASSWORD is missing");
      return;
    }

    const existingUsers = await this.usersService.list();
    const existingAdmin = existingUsers.find((user) => user.isAdmin);

    if (existingAdmin) {
      return;
    }

    await this.usersService.create({
      name,
      email,
      password,
      isAdmin: true,
      isEnabled: true,
    });

    console.log(`First admin user created: ${email}`);
  }
}
