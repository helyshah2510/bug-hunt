import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus, ForbiddenException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { RunnerService } from "../runner/runner.service.js";
import { Challenge, Difficulty, Prisma, ProgressStatus } from "@prisma/client";
import { LEVEL_POINTS } from "./challenges.config.js";


const PREVIOUS_LEVEL: Record<Difficulty, Difficulty | null> = {
    EASY: null,
    MEDIUM: 'EASY',
    HARD: 'MEDIUM'
}

@Injectable()
export class ChallengesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly runnerService: RunnerService
    ) { }

    private findGate(challenge: Pick<Challenge, 'difficulty' | 'order'>) {
        if (challenge.order > 1) {
            return {
                difficulty: challenge.difficulty,
                order: challenge.order - 1,
            };
        }
        const previousLevel = PREVIOUS_LEVEL[challenge.difficulty];

        if (previousLevel === null) {
            return null;
        }
        return {
            difficulty: previousLevel,
            order: 10,
        }
    }

    private async isDone(userId: string, challengeId: string): Promise<boolean> {
        const progress = await this.prisma.progress.findUnique({
            where: { userId_challengeId: { userId, challengeId } },
        });
        if (!progress) {
            return false;
        }
        return ([ProgressStatus.SOLVED, ProgressStatus.SKIPPED] as ProgressStatus[]).includes(progress.status);
    }

    private async assertUnlocked(userId: string, challenge: Pick<Challenge, 'difficulty' | 'order'>): Promise<void> {
        const gate = this.findGate(challenge);
        //no gate is open
        if (!gate) {
            return;
        }

        //find gate questionin in the database
        const gateChallenge = await this.prisma.challenge.findUnique({
            where: {
                difficulty_order: { difficulty: gate.difficulty, order: gate.order },
            },
        });

        //if the question doesnt exist keep the door closed
        if (!gateChallenge) {
            throw new ForbiddenException('Question is not available yet')
        }

        //if the player hasnt finished it keep it locked
        const done = await this.isDone(userId, gateChallenge.id);
        if (!done) {
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
    async findOne(userId: string, id: string) {
        const challenge = await this.prisma.challenge.findFirst({
            where: { id, status: 'APPROVED' },
            select: {
                id: true,
                title: true,
                description: true,
                difficulty: true,
                order: true,
                brokenCode: true,
                _count: { select: { hints: true } },
            },
        });
        if (challenge === null) {
            throw new NotFoundException('challenge not found');
        }
        await this.assertUnlocked(userId, challenge);
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
        await this.assertUnlocked(userId, challenge);

        const tests = challenge.testCases.map((t) => ({
            input: t.input,
            expectedOutput: t.expectedOutput,
        }));

        const result = await this.runnerService.runTests(code, tests);
        const passed =
            result.totalTests > 0 && result.passedTests === result.totalTests;

        const xpEarned = passed ? await this.recordSolve(userId, challenge, code) : 0;

        // a wrong answer costs one attempt, a correct one costs nothing
        if (!passed) {
            attempts = await this.spendAttempt(userId);
        }

        return {
            xpEarned,
            passed,
            passedTests: result.passedTests,
            totalTests: result.totalTests,
            attemptsLeft: attempts?.attemptsLeft,
            lockedUntil: attempts?.lockedUntil,
            explanation: passed ? challenge.explanation : undefined,
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

    private async recordSolve(userId: string, challenge: Challenge, code: string) {
        return this.prisma.$transaction(async (tx) => {
            const key = { userId, challengeId: challenge.id };
            await tx.progress.upsert({ where: { userId_challengeId: key }, create: key, update: {} });
            const claimed = await tx.progress.updateMany({
                where: { ...key, status: { not: ProgressStatus.SOLVED } },
                data: { status: ProgressStatus.SOLVED },
            });
            const xpEarned = claimed.count === 1 ? LEVEL_POINTS[challenge.difficulty].solveReward : 0

            if (claimed.count === 1) {
                await tx.user.update({ where: { id: userId }, data: { xp: { increment: xpEarned } } });
                await tx.attempt.create({
                    data: { ...key, submittedCode: code, passed: true, xpEarned },
                });
            }
            return xpEarned;
        });
    }

    private async spendXp(tx: Prisma.TransactionClient, userId: string, cost: number) {
        const result = await tx.user.updateMany({
            where: { id: userId, xp: { gte: cost } },
            data: { xp: { decrement: cost } },
        });
        if (result.count === 0) {
            throw new ForbiddenException('Not enough points');
        }
    }

    async useHint(userId: string, id: string) {
        const challenge = await this.prisma.challenge.findFirst({
            where: { id, status: 'APPROVED' },
            include: { hints: { orderBy: { order: 'asc' } } },
        });
        if (!challenge) {
            throw new NotFoundException('challenge not found');
        }
        await this.assertUnlocked(userId, challenge);
        return this.prisma.$transaction(async (tx) => {
            const key = { userId, challengeId: id };
            const progress = await tx.progress.upsert({
                where: { userId_challengeId: key },
                create: key,
                update: {},
            });
            if (progress.status !== "IN_PROGRESS") {
                throw new BadRequestException('Already finished');
            }
            if (progress.hintsUsed >= challenge.hints.length) {
                throw new BadRequestException('No hints left');
            }
            const claimed = await tx.progress.updateMany({
                where: { ...key, hintsUsed: progress.hintsUsed },
                data: { hintsUsed: { increment: 1 } },
            });
            if (claimed.count === 0) {
                throw new ConflictException('please try again');
            }
            await this.spendXp(tx, userId, LEVEL_POINTS[challenge.difficulty].hintCost);

            return { hint: challenge.hints[progress.hintsUsed].text, hintNumber: progress.hintsUsed + 1 };
        });
    }

    async skip(userId: string, id: string) {
        const challenge = await this.prisma.challenge.findFirst({
            where: { id, status: 'APPROVED' },
        });
        if (!challenge) {
            throw new NotFoundException('challenge not found');
        }
        await this.assertUnlocked(userId, challenge);

        return this.prisma.$transaction(async (tx) => {
            const key = { userId, challengeId: id };
            await tx.progress.upsert({ where: { userId_challengeId: key }, create: key, update: {} });
            const claimed = await tx.progress.updateMany({
                where: { ...key, status: ProgressStatus.IN_PROGRESS },
                data: { status: ProgressStatus.SKIPPED },
            });
            if (claimed.count === 0) {
                throw new BadRequestException('Already finished');
            }
            await this.spendXp(tx, userId, LEVEL_POINTS[challenge.difficulty].skipCost);
            return { skipped: true };
        });
    }
}