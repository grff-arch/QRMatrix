import { Module } from '@nestjs/common';
import { CodesModule } from './codes/codes.module.js';

@Module({
  imports: [CodesModule],
})
export class AppModule {}