import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty,IsString } from "class-validator";

export class RunDto{
    @ApiProperty({example:"print('hi') "})
    @IsString()
    @IsNotEmpty()
    source!:string;
}