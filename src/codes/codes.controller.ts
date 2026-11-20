import { Body, Controller, Get, Param, Post, Query, Render, Res } from '@nestjs/common';
import express from 'express';
import { CodesService } from './codes.service.js';

@Controller()
export class CodesController {
  constructor(private readonly codesService: CodesService) {}

  @Get()
  @Render('index')
  async getHome() {
    const items = await this.codesService.readAll();
    return { count: items.length, version: '0.0.3' };
  }

  @Get('codes')
  @Render('list')
  async getList() {
    const items = await this.codesService.readAll();
    return { items };
  }

  @Get('codes/new')
  @Render('new')
  getNewForm() {
    return {};
  }

  @Post('codes')
  async createCode(
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('color') color: string,
    @Res() res: express.Response,
  ) {
    const cleanTitle = (title || '').trim();
    const cleanContent = (content || '').trim();

    if (!cleanTitle || !cleanContent) {
      return res.redirect(
        '/access-denied?reason=' +
          encodeURIComponent(
            'Попытка создать QR-код с пустым названием или пустым содержимым. Система отклонила запрос: оба поля обязательны.',
          ),
      );
    }

    if (cleanContent.length > 300) {
      return res.redirect(
        '/access-denied?reason=' +
          encodeURIComponent(
            'Превышена допустимая длина кодируемого текста (более 300 символов). Система отклонила генерацию.',
          ),
      );
    }

    const created = await this.codesService.create(cleanTitle, cleanContent, color || '#000000');
    return res.redirect(`/codes/${created.id}`);
  }

  @Get('codes/:id')
  async getOne(@Param('id') id: string, @Res() res: express.Response) {
    const item = await this.codesService.findById(id);

    if (!item) {
      return res.redirect(
        '/access-denied?reason=' +
          encodeURIComponent(
            `Запрошена карточка QR-кода с ID «${id}», но такая запись отсутствует в базе данных.`,
          ),
      );
    }

    if (item.isPrivate) {
      return res.redirect(
        '/access-denied?reason=' +
          encodeURIComponent(
            `Попытка открыть закрытый системный QR-код (ID ${item.id}). У роли «Пользователь» недостаточно прав для просмотра.`,
          ),
      );
    }

    return res.render('detail', { item });
  }

  @Get('access-denied')
  @Render('access-denied')
  getAccessDenied(@Query('reason') reason?: string) {
    return {
      reason:
        reason ||
        'Попытка выполнить запрещённое действие или открыть недоступный QR-код без прав администратора.',
    };
  }
}