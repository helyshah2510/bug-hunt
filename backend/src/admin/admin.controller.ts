import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guard/roles.guard.js';
import { Roles } from '../auth/decorator/roles.decorator.js';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service.js';
import type { AuthenticatedRequest } from '../auth/guard/jwt-auth.guard.js';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
    constructor(private readonly adminService:AdminService){}

    @Get('dashboard')
    getDashboardStats(){
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
}
