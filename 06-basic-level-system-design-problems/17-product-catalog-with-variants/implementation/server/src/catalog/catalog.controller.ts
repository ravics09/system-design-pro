import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { InsufficientStockError, TooManyVariantsError } from '../engine/catalog';
import {
  adjustStockSchema,
  createProductSchema,
  resolveSchema,
  updateVariantSchema,
  type AdjustStockInput,
  type CreateProductInput,
  type ResolveInput,
  type UpdateVariantInput,
} from '../engine/catalog.types';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly svc: CatalogService) {}

  /** Create a product and generate its full variant matrix (Cartesian product). */
  @Post('products')
  create(@Body(new ZodValidationPipe(createProductSchema)) body: CreateProductInput) {
    try {
      return this.svc.engine.createProduct(body);
    } catch (err) {
      if (err instanceof TooManyVariantsError) throw new BadRequestException(err.message);
      throw err;
    }
  }

  @Get('products')
  list() {
    return this.svc.engine.list();
  }

  @Get('products/:id')
  get(@Param('id') id: string) {
    const detail = this.svc.engine.get(id);
    if (!detail) throw new NotFoundException(`Product ${id} not found`);
    return detail;
  }

  /** Resolve an option selection (e.g. {Size:'M',Color:'Blue'}) to a single variant. */
  @Post('products/:id/resolve')
  resolve(@Param('id') id: string, @Body(new ZodValidationPipe(resolveSchema)) body: ResolveInput) {
    if (!this.svc.engine.get(id)) throw new NotFoundException(`Product ${id} not found`);
    const variant = this.svc.engine.resolve(id, body.selection);
    return { variant };
  }

  /** Edit a variant's price and/or stock. */
  @Patch('variants/:sku')
  updateVariant(
    @Param('sku') sku: string,
    @Body(new ZodValidationPipe(updateVariantSchema)) body: UpdateVariantInput,
  ) {
    const v = this.svc.engine.updateVariant(sku, body);
    if (!v) throw new NotFoundException(`Variant ${sku} not found`);
    return v;
  }

  /** Atomic stock change (e.g. -1 on purchase); refuses to oversell. */
  @Post('variants/:sku/adjust')
  adjust(@Param('sku') sku: string, @Body(new ZodValidationPipe(adjustStockSchema)) body: AdjustStockInput) {
    try {
      const v = this.svc.engine.adjustStock(sku, body.delta);
      if (!v) throw new NotFoundException(`Variant ${sku} not found`);
      return v;
    } catch (err) {
      if (err instanceof InsufficientStockError) throw new ConflictException(err.message);
      throw err;
    }
  }

  @Get('filter')
  filter(@Query('type') type: string, @Query('value') value: string) {
    if (!type || !value) throw new BadRequestException('type and value query params are required');
    return this.svc.engine.filterByOption(type, value);
  }

  @Get('stats')
  stats() {
    return this.svc.engine.stats();
  }

  @Post('reset')
  reset() {
    this.svc.engine.reset();
    return { ok: true, ...this.svc.engine.stats() };
  }
}
