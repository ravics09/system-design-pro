import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfilesModule } from '../profiles/profiles.module';
import { MyListController } from './mylist.controller';
import { MyListService } from './mylist.service';
import { MyListItem, MyListItemSchema } from './mylist.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MyListItem.name, schema: MyListItemSchema }]),
    ProfilesModule,
  ],
  controllers: [MyListController],
  providers: [MyListService],
})
export class MyListModule {}
