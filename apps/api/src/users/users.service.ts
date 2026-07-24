import { Injectable } from '@nestjs/common'; @Injectable() export class UsersService { async findAll() { return { success: true, data: [] } } }
