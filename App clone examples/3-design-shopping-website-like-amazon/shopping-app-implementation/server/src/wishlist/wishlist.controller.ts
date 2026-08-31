import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, getUserId } from '../common/auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { addWishlistSchema, type AddWishlistInput } from './wishlist.dto';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
@UseGuards(AuthGuard)
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@Req() req: Request) {
    return this.wishlist.list(getUserId(req));
  }

  @Post()
  add(@Req() req: Request, @Body(new ZodValidationPipe(addWishlistSchema)) body: AddWishlistInput) {
    return this.wishlist.add(getUserId(req), body);
  }

  @Delete(':productId')
  remove(@Req() req: Request, @Param('productId', ParseIntPipe) productId: number) {
    return this.wishlist.remove(getUserId(req), productId);
  }
}
