import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ApplicationsModule } from './applications/applications.module'
import { TeamsModule } from './teams/teams.module'
import { JudgesModule } from './judges/judges.module'
import { ScoresModule } from './scores/scores.module'
import { LeaderboardModule } from './leaderboard/leaderboard.module'
import { EmailsModule } from './emails/emails.module'
import { AuditModule } from './audit/audit.module'
import { SettingsModule } from './settings/settings.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { HealthController } from './health/health.controller'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'

@Module({
  imports: [
    // Serve frontend static assets
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'web', 'dist'),
      exclude: ['/api/(.*)', '/health'],
    }),

    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Core
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ApplicationsModule,
    TeamsModule,
    JudgesModule,
    ScoresModule,
    LeaderboardModule,
    EmailsModule,
    AuditModule,
    SettingsModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
