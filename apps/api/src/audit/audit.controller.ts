import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuditService } from './audit.service'
import { AuthGuard, PermissionsGuard, RequirePermissions } from '../auth/guards'

@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions('SETTINGS_MANAGE') // Only SUPER_ADMIN can inspect audit logs
  findAll() {
    return this.service.findAll()
  }
}
