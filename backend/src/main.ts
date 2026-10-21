import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { SwaggerModule,DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({whitelist:true}));
  const config= new DocumentBuilder()
  .setTitle('Bug Hunt API')
  .setDescription('API Documentation for the bug hunt platform')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
  if (process.env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
