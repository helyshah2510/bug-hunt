import { ApiProperty } from "@nestjs/swagger";

export class SubmitDto{
    @ApiProperty({example:'def f(x):\n return x'})
    code!:string;
}