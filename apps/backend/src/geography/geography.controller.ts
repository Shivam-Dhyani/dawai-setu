import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GeographyService } from './geography.service';

// Public reference data — no auth guard required.
@ApiTags('geography')
@Controller('geography')
export class GeographyController {
  constructor(private readonly geography: GeographyService) {}

  @Get('states')
  listStates() {
    return this.geography.listStates();
  }

  @Get('cities')
  listCities(@Query('stateId') stateId: string) {
    return this.geography.listCities(stateId);
  }
}
