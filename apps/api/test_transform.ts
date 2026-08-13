import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { IsNumber, IsOptional, validate } from 'class-validator';

class Dto {
  @IsNumber()
  @IsOptional()
  score: number | null;
}

async function run() {
  const obj = { score: null };
  const instance = plainToInstance(Dto, obj, { enableImplicitConversion: true });
  console.log('Instance:', instance);
  const errors = await validate(instance);
  console.log('Errors:', errors);
}
run();
