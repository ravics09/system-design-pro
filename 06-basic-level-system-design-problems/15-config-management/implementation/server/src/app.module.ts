import { Module } from '@nestjs/common';
import { ConfigApiModule } from './config-api/config.module';

@Module({
  imports: [ConfigApiModule],
})
export class AppModule {}
