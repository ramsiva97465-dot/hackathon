import { Controller, Get, Post, Body, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { HelpRequestsService } from './help-requests.service';
import { ParticipantGuard } from '../auth/participant.guard';
import { AuthGuard, PermissionsGuard, RequirePermissions } from '../auth/guards';

@Controller('help-requests')
export class HelpRequestsController {
  constructor(private readonly service: HelpRequestsService) {}

  @Post()
  @UseGuards(ParticipantGuard)
  create(
    @Req() req: any,
    @Body('issueType') issueType: string,
    @Body('description') description?: string
  ) {
    const teamId = req.participant?.teamId;
    if (!teamId) {
      throw new Error('Participant is not part of a team');
    }
    return this.service.create(teamId, issueType, description);
  }

  @Get('active')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('SETTINGS_MANAGE')
  getActive() {
    return this.service.getActive();
  }

  @Patch(':id/resolve')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('SETTINGS_MANAGE')
  resolve(@Param('id') id: string) {
    return this.service.resolve(id);
  }
}
