// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CodeController } from './code/code.controller';
import { CodeService } from './code/code.service';
import { WhisperController } from './whisper.controller'; // تغییر مسیر صحیح
import { WhisperService } from './whisper.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, CodeController, WhisperController],
  providers: [AppService, CodeService, WhisperService],
})
export class AppModule {}
