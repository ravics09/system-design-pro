import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from './config';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { AddressesModule } from './addresses/addresses.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    MongooseModule.forRoot(config.MONGODB_URI),
    AuthModule,
    CatalogModule,
    CartModule,
    WishlistModule,
    AddressesModule,
    OrdersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
