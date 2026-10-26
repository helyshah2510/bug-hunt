import { Controller, Delete, Get, Req, UnauthorizedException, UseGuards,Param,Query,BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guard/roles.guard.js';
import { Roles } from '../auth/decorator/roles.decorator.js';
import { Role,Difficulty } from '@prisma/client';
import { AdminService } from './admin.service.js';
import type { AuthenticatedRequest } from '../auth/guard/jwt-auth.guard.js';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  findAllUsers(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException();
    }

    return this.adminService.findAllUsers(userId);
  }

  @Delete('users/:id')
  deleteUser(
    @Param('id')userId:string,
    @Req()req:AuthenticatedRequest,
  ){
    const currentUserId=req.user?.sub;
    if(!currentUserId){
      throw new UnauthorizedException();
    }
    return this.adminService.deleteUser(
      userId,
      currentUserId,
    );
  }

  @Get('users/:id/progress')
  getUserProgress(@Param('id') userId:string){
    return this.adminService.getUserProgress(userId);
  }

  @Get('challenges')
  findAllChallenges(@Query('difficulty')difficulty?:string){
    if(
      difficulty &&
      !Object.values(Difficulty).includes(difficulty as Difficulty)
    ){
      throw new BadRequestException(
        'Difficulty must be EASY, MEDIUM or HARD',
      );
    }
    return this.adminService.findAllChallenges(
      difficulty as Difficulty | undefined, 
    );
  }

  @Get('challenges/:id')
  findChallenge(@Param('id')id:string){
    return this.adminService.findChallengeById(id);
  }
}
