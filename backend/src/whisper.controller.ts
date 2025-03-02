// backend/src/whisper.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WhisperService } from './whisper.service';

@Controller('whisper')
export class WhisperController {
  constructor(private readonly whisperService: WhisperService) {}

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('file'))
  async transcribeAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: 'فایلی آپلود نشده است' };
    }
    
    const text = await this.whisperService.transcribeAudio(file.path);
    return { text };
  }
}
