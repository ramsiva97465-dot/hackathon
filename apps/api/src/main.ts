import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
    cors: {
      origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3002', 'http://localhost:5173'].filter(Boolean) as string[],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    },
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  )

  // Global prefix
  app.setGlobalPrefix('api', { exclude: ['health'] })

  const port = process.env.PORT ?? 3001
  await app.listen(port)

  console.log(`\n🚀 AI Voice Hackathon API running on http://localhost:${port}/api`)
  console.log(`📡 WebSocket available on ws://localhost:${port}`)
}

bootstrap()
