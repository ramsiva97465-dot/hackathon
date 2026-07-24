import { IsString, IsEmail, IsOptional, IsArray, IsEnum, ValidateNested, IsNotEmpty } from 'class-validator'
import { Type } from 'class-transformer'

export class MemberDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsEmail()
  email: string

  @IsString()
  @IsOptional()
  phone?: string

  @IsString()
  @IsNotEmpty()
  linkedin: string

  @IsString()
  @IsOptional()
  github?: string

  @IsString()
  @IsOptional()
  role?: string
}

export class CreateApplicationDto {
  @IsString()
  @IsOptional()
  teamName?: string

  @IsEnum(['INDIVIDUAL', 'TEAM'])
  type: 'INDIVIDUAL' | 'TEAM'

  @IsString()
  @IsOptional()
  city?: string

  @IsString()
  @IsOptional()
  projectTitle?: string

  @IsString()
  @IsOptional()
  projectDescription?: string

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  techStack?: string[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberDto)
  members: MemberDto[]
}
