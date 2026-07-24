import { Injectable } from '@nestjs/common'; @Injectable() export class ScoresService { async findAll() { return { success: true, data: [] } } }
