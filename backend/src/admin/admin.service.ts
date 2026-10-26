import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async findAllUsers(currentUserId: string) {
        return this.prisma.user.findMany({
            where: {
                id: { not: currentUserId },
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                xp: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async getDashboardStats() {
        const [
            totalUsers,
            totalChallenges,
            totalAttempts,
            easyChallenges,
            mediumChallenges,
            hardChallenges,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.challenge.count(),
            this.prisma.attempt.count(),
            this.prisma.challenge.count({
                where: { difficulty: 'EASY' },
            }),
            this.prisma.challenge.count({
                where: { difficulty: 'MEDIUM' },
            }),
            this.prisma.challenge.count({
                where: { difficulty: 'HARD' },
            }),
        ]);

        return {
            totalUsers,
            totalChallenges,
            totalAttempts,
            challengesByDifficulty: {
                easy: easyChallenges,
                medium: mediumChallenges,
                hard: hardChallenges,
            },
        };
    }

    async deleteUser(userId: string, currentUserId: string) {
        if (userId === currentUserId) {
            throw new NotFoundException('You can not delete your own account');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.prisma.user.delete({
            where: { id: userId },
        });
        return { message: 'user deleted ' };
    }

    async getUserProgress(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                xp: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('user not found');
        }
        const [progress, attempts] = await Promise.all([
            this.prisma.progress.findMany({
                where: { userId },
                select: {
                    status: true,
                    hintsUsed: true,
                    createdAt: true,
                    updatedAt: true,
                    challenge: {
                        select: {
                            id: true,
                            title: true,
                            difficulty: true,
                            order: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' }
            }),
            this.prisma.attempt.findMany({
                where: { userId },
                select: {
                    passed: true,
                    xpEarned: true,
                },
            }),
        ]);
        return {
            user,
            statistics: {
                totalChallengesTracked: progress.length,
                solved: progress.filter(p => p.status === 'SOLVED').length,
                inProgress: progress.filter(
                    p => p.status === 'IN_PROGRESS',
                ).length,
                skipped: progress.filter(p => p.status === 'SKIPPED').length,
                totalAttempts: attempts.length,
                successfulAttempts: attempts.filter(a => a.passed).length,
                failedAttempts: attempts.filter(a => !a.passed).length,
                xpEarnedFromAttempts: attempts.reduce(
                    (total, attempt) => total + attempt.xpEarned,
                    0,
                ),
            },
            progress,
        };
    }
    async findAllChallenges(
        difficulty?: 'EASY'|'MEDIUM'|'HARD'){
        return this.prisma.challenge.findMany({
            where: difficulty?{difficulty}:{},
            select:{
                id:true,
                title:true,
                description:true,
                difficulty:true,
                order:true,
                status:true,
                createdAt:true,
            },
            orderBy:[
                {difficulty:'asc'},
                {order:'asc'},
            ],
        });
    }
}
