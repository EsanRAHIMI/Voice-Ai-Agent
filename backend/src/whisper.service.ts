// backend/src/whisper.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';

@Injectable()
export class WhisperService {
  private apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY')!;
    if (!this.apiKey) {
      throw new Error('❌ مقدار OPENAI_API_KEY در فایل .env تنظیم نشده است!');
    }
    if (!this.apiKey) {
      throw new Error('❌ OPENAI_API_KEY در فایل .env تنظیم نشده است!');
    }
  }

  async transcribeAudio(filePath: string): Promise<string> {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('model', 'whisper-1');
    form.append('language', 'fa'); // زبان فارسی

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        form,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            ...form.getHeaders(),
          },
        }
      );
      return response.data.text; // متن استخراج‌شده
    } catch (error) {
      console.error('❌ خطا در پردازش فایل صوتی:', error.response.data);
      throw new Error('مشکلی در پردازش صدا وجود دارد');
    }
  }
}
