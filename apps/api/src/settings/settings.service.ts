import { Injectable } from '@nestjs/common'; @Injectable() export class SettingsService { async findAll() { return { success: true, data: [] } } }
