import { CanActivate,ExecutionContext,ForbiddenException,Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { ROLES_KEY } from "../decorator/roles.decorator.js";
import type { AuthenticatedRequest } from "./jwt-auth.guard.js";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class RolesGuard implements CanActivate{
    constructor(
        private reflector:Reflector,
        private prisma:PrismaService
    ){}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        //read the sign on the door
        const allowedRoles= this.reflector.getAllAndOverride<Role[]>(ROLES_KEY,[
            context.getHandler(),
            context.getClass(),
        ]);

        if(!allowedRoles){
           return true;
        }

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const userId=request.user?.sub;

        if (!userId) {
            throw new ForbiddenException();
        }
        const user= await this.prisma.user.findUnique({
            where:{id:userId},
            select:{role:true},
        });

        if(!user || !allowedRoles.includes(user.role)){
            throw new ForbiddenException('Admins only ')
        }
        return true;
    }
}