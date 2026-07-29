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
import { AnnouncementsModule } from './announcements/announcements.module'
import { HelpRequestsModule } from './help-requests/help-requests.module'
import { HealthController } from './health/health.controller'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'

@Module({
  imports: [
    // Serve frontend static assets
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'web', 'dist'),
      exclude: ['/api/(.*)', '/health'],
      serveStaticOptions: {
        maxAge: 31536000000, // 1 year in milliseconds
        setHeaders: (res, path) => {
          if (path.endsWith('.html')) {
            // HTML files should check for changes on every request
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
          } else {
            // Hashed JS, CSS, images, and fonts can be cached forever
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          }
        },
      },
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
    AnnouncementsModule,
    HelpRequestsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
