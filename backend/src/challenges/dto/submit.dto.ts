import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SubmitDto{
    @ApiProperty({example:'def f(x):\n return x'})
    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    code!:string;
}