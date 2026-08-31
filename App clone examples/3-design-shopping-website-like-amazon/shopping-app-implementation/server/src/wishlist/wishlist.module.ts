import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { WishlistItem, WishlistItemSchema } from './wishlist.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: WishlistItem.name, schema: WishlistItemSchema }])],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
