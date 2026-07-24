import { Injectable } from '@nestjs/common'; @Injectable() export class JudgesService { async findAll() { return { success: true, data: [] } } }
