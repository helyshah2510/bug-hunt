import { Injectable, NotFoundException,BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { RunnerService } from "../runner/runner.service.js";

@Injectable()
export class ChallengesService{
    constructor(
        private readonly prisma:PrismaService,
        private readonly runnerService:RunnerService
    ){}

    findAll(){
        return this.prisma.challenge.findMany({
            where:{status:'APPROVED'},
            select:{id:true,title:true,difficulty:true},
            orderBy:{createdAt:'desc'},
        });
    }
    async findOne(id:string){
        const challenge= await this.prisma.challenge.findFirst({
            where:{id,status:'APPROVED'},
            select:{
                id:true,
                title:true,
                description:true,
                difficulty:true,
                brokenCode:true,
                _count:{select:{hints:true}},
            },
        });
        if(challenge === null){
            throw new NotFoundException('challenge not found');
        }
        return challenge;
    }
    
    async submit(id:string,code:string){
        //reject bad input before sending it to judge0
        if(
            typeof code!=='string' ||
            code.trim().length===0 ||
            code.length>5000
        ){
            throw new BadRequestException('code must not be text, not empty, and at most 5000 characters');
        }

        //Load the challenge together with its hidden tests
        const challenge= await this.prisma.challenge.findFirst({
            where:{id,status:'APPROVED'},
            include:{testCases:{orderBy:{order:'asc'}}},
        });

        if(challenge===null){
            throw new NotFoundException('challenge not found');
        }

        if(challenge.testCases.length===0){
            throw new NotFoundException('this challenge has no tests yet');
        }

        //keep only the two fields run tests needs
        const tests=challenge.testCases.map((t)=>({
            input:t.input,
            expectedOutput:t.expectedOutput,
        }));
        
        //run the players code against every test
        const result= await this.runnerService.runTests(code,tests);

        return{
            passed: result.totalTests > 0 && result.passedTests === result.totalTests,
            passedTests:result.passedTests,
            totalTests:result.totalTests,
        };
    }
}