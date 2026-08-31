import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { OmdbService } from './omdb.service';

@Controller('catalog')
@UseGuards(AuthGuard)
export class CatalogController {
  constructor(private readonly omdb: OmdbService) {}

  /** Billboard + curated rows (cached OMDb searches). */
  @Get('browse')
  browse() {
    return this.omdb.browse();
  }

  @Get('search')
  search(@Query('q') q?: string) {
    return this.omdb.search(q ?? '');
  }

  @Get('title/:imdbID')
  title(@Param('imdbID') imdbID: string) {
    return this.omdb.title(imdbID);
  }
}
