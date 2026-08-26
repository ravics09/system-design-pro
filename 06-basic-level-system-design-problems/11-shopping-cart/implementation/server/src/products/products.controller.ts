import { Controller, Get, Post } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Get()
  list() {
    return this.products.list();
  }

  @Post('seed')
  seed() {
    return this.products.seed();
  }
}
