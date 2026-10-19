import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'hely@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ example: 'detective_Hely' })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(20)
    username!: string;

    @ApiProperty({ example: '4-6-digit long-password' })
    @IsString()
    @MinLength(4)
    @MaxLength(6)
    password!: string;
}