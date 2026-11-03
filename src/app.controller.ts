import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
   getRoot(): string {
    return `
      <!DOCTYPE html>
      <html lang="ru">
        <head>
          <meta charset="UTF-8" />
          <title>QRMatrix</title>
        </head>
        <body>
          <div class="card">
            <h1>QRMatrix</h1>
            <p>Web-сервис генерации и управления QR-кодами и штрих-кодами</p>
            <p><span class="version">Версия 0.0.1</span></p>
            <p class="status">Разработка системы в процессе</p>
          </div>
        </body>
      </html>
    `;
  }
}
