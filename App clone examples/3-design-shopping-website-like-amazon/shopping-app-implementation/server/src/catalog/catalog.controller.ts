import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { WooCommerceService, type ProductQuery } from './woocommerce.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly woo: WooCommerceService) {}

  /** Product listing with pagination, search, category filter, and sort (cached WooCommerce). */
  @Get('products')
  list(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
  ) {
    const q: ProductQuery = {
      page: page ? Number(page) : 1,
      perPage: perPage ? Number(perPage) : undefined,
      search: search || undefined,
      category: category || undefined,
      sort: (sort as ProductQuery['sort']) || undefined,
    };
    return this.woo.listProducts(q);
  }

  @Get('categories')
  categories() {
    return this.woo.categories();
  }

  @Get('products/:id')
  product(@Param('id', ParseIntPipe) id: number) {
    return this.woo.getProduct(id);
  }
}
