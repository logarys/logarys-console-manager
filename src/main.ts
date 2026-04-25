import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const host = process.env.APP_HOST ?? "0.0.0.0";
  const port = Number(process.env.APP_PORT ?? 3000);

  await app.listen(port, host);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
