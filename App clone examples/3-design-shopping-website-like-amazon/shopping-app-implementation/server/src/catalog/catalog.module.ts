import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { WooCommerceService } from './woocommerce.service';

@Module({
  controllers: [CatalogController],
  providers: [WooCommerceService],
  exports: [WooCommerceService],
})
export class CatalogModule {}
