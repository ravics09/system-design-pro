import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CartsService } from './carts.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  addItemSchema,
  checkoutSchema,
  mergeSchema,
  setQtySchema,
  type AddItemInput,
  type CheckoutInput,
  type MergeInput,
  type SetQtyInput,
} from './carts.dto';

/**
 * `ownerKey` identifies the cart: "user:<id>" for logged-in users or
 * "guest:<sessionId>" for anonymous carts. In production it's derived from the
 * session/JWT for logged-in users, not trusted from the path.
 */
@Controller('carts')
export class CartsController {
  constructor(private readonly carts: CartsService) {}

  @Get(':ownerKey')
  get(@Param('ownerKey') ownerKey: string) {
    return this.carts.getCart(ownerKey);
  }

  @Post(':ownerKey/items')
  addItem(
    @Param('ownerKey') ownerKey: string,
    @Body(new ZodValidationPipe(addItemSchema)) body: AddItemInput,
  ) {
    return this.carts.addItem(ownerKey, body.productId, body.quantity);
  }

  @Patch(':ownerKey/items/:productId')
  setQty(
    @Param('ownerKey') ownerKey: string,
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(setQtySchema)) body: SetQtyInput,
  ) {
    return this.carts.setQty(ownerKey, productId, body.quantity);
  }

  @Delete(':ownerKey/items/:productId')
  removeItem(@Param('ownerKey') ownerKey: string, @Param('productId') productId: string) {
    return this.carts.removeItem(ownerKey, productId);
  }

  @Post(':ownerKey/merge')
  merge(
    @Param('ownerKey') ownerKey: string,
    @Body(new ZodValidationPipe(mergeSchema)) body: MergeInput,
  ) {
    return this.carts.merge(ownerKey, body.fromOwnerKey);
  }

  @Post(':ownerKey/checkout')
  checkout(
    @Param('ownerKey') ownerKey: string,
    @Body(new ZodValidationPipe(checkoutSchema)) body: CheckoutInput,
  ) {
    return this.carts.checkout(ownerKey, body.idempotencyKey);
  }
}
