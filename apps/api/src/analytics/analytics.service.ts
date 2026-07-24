import { Injectable } from '@nestjs/common'; @Injectable() export class AnalyticsService { async findAll() { return { success: true, data: [] } } }
