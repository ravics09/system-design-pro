import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from './config';
import { ProductsModule } from './products/products.module';
import { CartsModule } from './carts/carts.module';

@Module({
  imports: [MongooseModule.forRoot(config.MONGODB_URI), ProductsModule, CartsModule],
})
export class AppModule {}
