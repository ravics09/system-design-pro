import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, getUserId } from '../common/auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { addItemSchema, setQtySchema, type AddItemInput, type SetQtyInput } from './cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@Req() req: Request) {
    return this.cart.get(getUserId(req));
  }

  @Post('items')
  add(@Req() req: Request, @Body(new ZodValidationPipe(addItemSchema)) body: AddItemInput) {
    return this.cart.addItem(getUserId(req), body);
  }

  @Patch('items/:productId')
  setQty(
    @Req() req: Request,
    @Param('productId', ParseIntPipe) productId: number,
    @Body(new ZodValidationPipe(setQtySchema)) body: SetQtyInput,
  ) {
    return this.cart.setQty(getUserId(req), productId, body.qty);
  }

  @Delete('items/:productId')
  remove(@Req() req: Request, @Param('productId', ParseIntPipe) productId: number) {
    return this.cart.removeItem(getUserId(req), productId);
  }

  @Delete()
  clear(@Req() req: Request) {
    return this.cart.clear(getUserId(req));
  }
}
