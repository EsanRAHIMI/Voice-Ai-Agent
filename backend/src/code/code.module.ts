// backend_api/src/code/code.module.ts
import { Module } from '@nestjs/common';
import { CodeController } from './code.controller';
import { CodeService } from './code.service';

@Module({
  controllers: [CodeController],
  providers: [CodeService],
})
export class CodeModule {}
