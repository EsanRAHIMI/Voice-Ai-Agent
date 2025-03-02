import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3100);
  console.log('✅ NestJS API running on http://localhost:3100');

}
bootstrap();
