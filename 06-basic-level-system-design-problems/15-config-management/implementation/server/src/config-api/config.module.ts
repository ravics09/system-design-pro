import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { ConfigManagerService } from './config.service';

@Module({
  controllers: [ConfigController],
  providers: [ConfigManagerService],
})
export class ConfigApiModule {}
