import { Injectable,NotFoundException } from '@nestjs/common';
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

    async deleteUser(userId:string,currentUserId:string){
        if(userId===currentUserId){
            throw new NotFoundException('You can not delete your own account');
        }
        const user=await this.prisma.user.findUnique({
            where:{id:userId},
            select:{id:true},
        });
        if(!user){
            throw new NotFoundException('User not found');
        }
        await this.prisma.user.delete({
            where:{id:userId},
        });
        return{message:'user deleted '};
    }
}
