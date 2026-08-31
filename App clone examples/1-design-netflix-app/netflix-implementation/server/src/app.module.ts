import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from './config';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { CatalogModule } from './catalog/catalog.module';
import { MyListModule } from './mylist/mylist.module';
import { HistoryModule } from './history/history.module';
import { RatingsModule } from './ratings/ratings.module';

@Module({
  imports: [
    MongooseModule.forRoot(config.MONGODB_URI),
    AuthModule,
    ProfilesModule,
    CatalogModule,
    MyListModule,
    HistoryModule,
    RatingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
