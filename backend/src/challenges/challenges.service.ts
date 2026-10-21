import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { RunnerService } from "../runner/runner.service.js";
import { Challenge, Difficulty, ProgressStatus } from "@prisma/client";


const PREVIOUS_LEVEL: Record<Difficulty,Difficulty | null>={
    EASY:null,
    MEDIUM:'EASY',
    HARD:'MEDIUM'
}

@Injectable()
export class ChallengesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly runnerService: RunnerService
    ) { }

    private findGate(challenge: Pick<Challenge, 'difficulty' | 'order'>)
    {
        if(challenge.order>1){
            return{
                difficulty:challenge.difficulty,
                order:challenge.order-1,
            };
        }
        const previousLevel=PREVIOUS_LEVEL[challenge.difficulty];

        if(previousLevel===null){
            return null;
        }
        return{
            difficulty:previousLevel,
            order:10,
        }
    }

    private async isDone(userId:string,challengeId:string):Promise<boolean>{
        const progress= await this.prisma.progress.findUnique({
            where:{userId_challengeId:{userId,challengeId}},
        });
        if(!progress){
            return false;
        }
        return([ProgressStatus.SOLVED,ProgressStatus.SKIPPED] as ProgressStatus[]).includes(progress.status);
    }

    private async assertUnlocked(userId: string, challenge: Pick<Challenge, 'difficulty' | 'order'>): Promise<void>{
        const gate=this.findGate(challenge);
        //no gate is open
        if(!gate){
            return;
        }

        //find gate questionin in the database
        const gateChallenge= await this.prisma.challenge.findUnique({
            where:{
                difficulty_order:{difficulty:gate.difficulty, order:gate.order},
            },
        });

        //if the question doesnt exist keep the door closed
        if(!gateChallenge){
            throw new ForbiddenException('Question is not available yet')
        }

        //if the player hasnt finished it keep it locked
        const done=await this.isDone(userId,gateChallenge.id);
        if(!done){
            throw new ForbiddenException('finish previous question first');
        }
    }

    findAll() {
        return this.prisma.challenge.findMany({
            where: { status: 'APPROVED' },
            select: { id: true, title: true, difficulty: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id: string) {
        const challenge = await this.prisma.challenge.findFirst({
            where: { id, status: 'APPROVED' },
            select: {
                id: true,
                title: true,
                description: true,
                difficulty: true,
                brokenCode: true,
                _count: { select: { hints: true } },
            },
        });
        if (challenge === null) {
            throw new NotFoundException('challenge not found');
        }
        return challenge;
    }

    async submit(userId: string, id: string, code: string) {
        // reject bad input before doing anything else
        if (
            typeof code !== 'string' ||
            code.trim().length === 0 ||
            code.length > 5000
        ) {
            throw new BadRequestException('code must be text, not empty, and at most 5000 characters');
        }

        // locked players stop here and never reach Judge0
        let attempts = await this.checkAttempts(userId);

        const challenge = await this.prisma.challenge.findFirst({
            where: { id, status: 'APPROVED' },
            include: { testCases: { orderBy: { order: 'asc' } } },
        });
        if (challenge === null) {
            throw new NotFoundException('challenge not found');
        }
        if (challenge.testCases.length === 0) {
            throw new NotFoundException('this challenge has no tests yet');
        }

        const tests = challenge.testCases.map((t) => ({
            input: t.input,
            expectedOutput: t.expectedOutput,
        }));

        const result = await this.runnerService.runTests(code, tests);
        const passed =
            result.totalTests > 0 && result.passedTests === result.totalTests;

        // a wrong answer costs one attempt, a correct one costs nothing
        if (!passed) {
            attempts = await this.spendAttempt(userId);
        }

        return {
            passed,
            passedTests: result.passedTests,
            totalTests: result.totalTests,
            attemptsLeft: attempts?.attemptsLeft,
            lockedUntil: attempts?.lockedUntil,
        };
    }

    private readonly LOCK_MS = 10 * 60 * 1000;
    private readonly MAX_ATTEMPTS = 5;

    private async checkAttempts(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { attemptsLeft: true, lockedUntil: true },
        });
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        const now = new Date();
        if (user.lockedUntil) {
            // Still locked: refuse, and say how long is left
            if (user.lockedUntil > now) {
                const minutesLeft = Math.ceil(
                    (user.lockedUntil?.getTime() - now.getTime()) / 60000,
                );
                throw new HttpException(
                    `No attempts left.Try again in ${minutesLeft} minutes(s).`,
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }
            //Lock is over: give all 5 back
            return this.prisma.user.update({
                where: { id: userId },
                data: { attemptsLeft: this.MAX_ATTEMPTS, lockedUntil: null },
                select: { attemptsLeft: true, lockedUntil: true },
            });
        }
        return user;
    }

    private async spendAttempt(userId: string) {
        // The database checks "> 0" and subtracts in ONE step
        await this.prisma.user.updateMany({
            where: { id: userId, attemptsLeft: { gt: 0 } },
            data: { attemptsLeft: { decrement: 1 } },
        });
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { attemptsLeft: true, lockedUntil: true },
        });
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        // Just hit 0? Start the 10 minute lock
        if (user && user.attemptsLeft === 0 && !user.lockedUntil) {
            return this.prisma.user.update({
                where: { id: userId },
                data: { lockedUntil: new Date(Date.now() + this.LOCK_MS) },
                select: { attemptsLeft: true, lockedUntil: true },
            });
        }
        return user;
    }
}