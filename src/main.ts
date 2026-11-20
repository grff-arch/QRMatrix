import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'node_modules/bootstrap/dist'), {
    prefix: '/vendor/bootstrap/',
  });

  app.setBaseViewsDir(join(process.cwd(), 'views'));
  app.setViewEngine('hbs');

  const port = Number(process.env.PORT) || 8080;
  await app.listen(port);
}
bootstrap();