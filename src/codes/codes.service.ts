import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
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

interface QrCodeRow {
  id: number;
  title: string;
  content: string;
  color: string;
  is_private: boolean;
  data_url: string;
  created_at: string;
}

@Injectable()
export class CodesService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL || 'postgres://app:app@db:5432/app';
    this.pool = new Pool({ connectionString });
  }

  async onModuleInit() {
    await this.connectWithRetry();
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS qr_codes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(120) NOT NULL,
        content TEXT NOT NULL,
        color VARCHAR(20) NOT NULL DEFAULT '#000000',
        is_private BOOLEAN NOT NULL DEFAULT FALSE,
        data_url TEXT NOT NULL,
        created_at VARCHAR(20) NOT NULL
      );
    `);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  private async connectWithRetry(retries = 15, delayMs = 1500): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const client = await this.pool.connect();
        client.release();
        return;
      } catch (err) {
        if (attempt === retries) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  private mapRow(row: QrCodeRow): QrItem {
    return {
      id: String(row.id),
      title: row.title,
      content: row.content,
      color: row.color,
      isPrivate: row.is_private,
      dataUrl: row.data_url,
      createdAt: row.created_at,
    };
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

  async readAll(): Promise<QrItem[]> {
    const result = await this.pool.query<QrCodeRow>(
      'SELECT id, title, content, color, is_private, data_url, created_at FROM qr_codes ORDER BY id ASC',
    );
    return result.rows.map((row) => this.mapRow(row));
  }

  async findById(id: string): Promise<QrItem | undefined> {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return undefined;
    }

    const result = await this.pool.query<QrCodeRow>(
      'SELECT id, title, content, color, is_private, data_url, created_at FROM qr_codes WHERE id = $1',
      [numericId],
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : undefined;
  }

  async create(title: string, content: string, color: string): Promise<QrItem> {
    const validColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#000000';
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    const dataUrl = await this.generateQrDataUrl(cleanContent, validColor);
    const createdAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const result = await this.pool.query<QrCodeRow>(
      `INSERT INTO qr_codes (title, content, color, is_private, data_url, created_at)
       VALUES ($1, $2, $3, FALSE, $4, $5)
       RETURNING id, title, content, color, is_private, data_url, created_at`,
      [cleanTitle, cleanContent, validColor, dataUrl, createdAt],
    );

    return this.mapRow(result.rows[0]);
  }
}