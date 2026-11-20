import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

export interface QrItem {
  id: string;
  title: string;
  content: string;
  color: string;
  isPrivate: boolean;
  dataUrl: string;
  createdAt: string;
}

@Injectable()
export class CodesService implements OnModuleInit {
  private readonly dataFilePath = path.join(process.cwd(), 'data', 'codes.json');

  async onModuleInit() {
    const dir = path.dirname(this.dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const existing = this.readAll();
    if (existing.length === 0) {
      const seedItems: QrItem[] = [
        {
          id: '1',
          title: 'Репозиторий QRMatrix на GitHub',
          content: 'https://github.com/grff-arch/QRMatrix',
          color: '#111827',
          isPrivate: false,
          dataUrl: await this.generateQrDataUrl('https://github.com/grff-arch/QRMatrix', '#111827'),
          createdAt: '2026-11-20 12:00',
        },
        {
          id: '2',
          title: 'Сайт УлГТУ',
          content: 'https://ulstu.ru',
          color: '#1d4ed8',
          isPrivate: false,
          dataUrl: await this.generateQrDataUrl('https://ulstu.ru', '#1d4ed8'),
          createdAt: '2026-11-20 12:05',
        },
        {
          id: '99',
          title: 'Служебный ключ доступа (Закрытый)',
          content: 'SECRET-ADMIN-TOKEN-2026',
          color: '#991b1b',
          isPrivate: true,
          dataUrl: await this.generateQrDataUrl('SECRET-ADMIN-TOKEN-2026', '#991b1b'),
          createdAt: '2026-11-20 12:10',
        },
      ];
      this.writeAll(seedItems);
    }
  }

  private async generateQrDataUrl(text: string, darkColor: string): Promise<string> {
    return QRCode.toDataURL(text, {
      width: 260,
      margin: 2,
      color: {
        dark: darkColor,
        light: '#ffffff',
      },
    });
  }

  readAll(): QrItem[] {
    if (!fs.existsSync(this.dataFilePath)) {
      return [];
    }
    const raw = fs.readFileSync(this.dataFilePath, 'utf-8').trim();
    if (!raw) return [];
    return JSON.parse(raw) as QrItem[];
  }

  private writeAll(items: QrItem[]): void {
    fs.writeFileSync(this.dataFilePath, JSON.stringify(items, null, 2), 'utf-8');
  }

  findById(id: string): QrItem | undefined {
    return this.readAll().find((item) => item.id === id);
  }

  async create(title: string, content: string, color: string): Promise<QrItem> {
    const items = this.readAll();
    const numericIds = items.map((i) => Number(i.id)).filter((n) => !Number.isNaN(n));
    const nextId = numericIds.length > 0 ? String(Math.max(...numericIds) + 1) : '1';

    const validColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#000000';
    const dataUrl = await this.generateQrDataUrl(content, validColor);

    const newItem: QrItem = {
      id: nextId,
      title: title.trim(),
      content: content.trim(),
      color: validColor,
      isPrivate: false,
      dataUrl,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    items.push(newItem);
    this.writeAll(items);
    return newItem;
  }
}