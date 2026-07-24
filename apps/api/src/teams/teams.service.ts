import { Injectable } from '@nestjs/common'; @Injectable() export class TeamsService { async findAll() { return { success: true, data: [] } } }
