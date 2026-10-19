import { ApiProperty } from "@nestjs/swagger";
import { IsString,IsNotEmpty,IsEmail } from "class-validator";

export class LoginDto{
    @ApiProperty({example:'hely@example.com'})
    @IsEmail()
    @IsNotEmpty()
    email!:string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    password:string;
}