import { randomToken } from '../common/crypto';
import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, getUserId } from '../common/auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { checkoutSchema, type CheckoutInput } from './orders.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** Place an order from the cart. Send an `Idempotency-Key` header to make retries safe. */
  @Post('checkout')
  checkout(
    @Req() req: Request,
    @Body(new ZodValidationPipe(checkoutSchema)) body: CheckoutInput,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.orders.checkout(getUserId(req), body.addressId, idempotencyKey || randomToken());
  }

  @Get()
  list(@Req() req: Request) {
    return this.orders.list(getUserId(req));
  }

  @Get(':id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.orders.get(getUserId(req), id);
  }
}
