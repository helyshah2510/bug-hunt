import { CanActivate,ExecutionContext,Injectable,UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

export interface JwtPayload{
    sub:string;
    iat?:number;
    exp:number;
}

//who is calling
export type AuthenticatedRequest= Request & {user?:JwtPayload};

@Injectable()
export class JwtAuthGuard implements CanActivate{
    constructor(private readonly jwtService:JwtService){}

    async canActivate(context: ExecutionContext):Promise<boolean>{
        const request= context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token = this.extractToken(request);

        if(!token){
            throw new UnauthorizedException('Please login first');
        }

        try{
            //checks the signature and expiry time
            request.user= await this.jwtService.verifyAsync<JwtPayload>(token);
        }catch{
            throw new UnauthorizedException('Your token has been expired');
        }
        return true;
    }
    private extractToken(request:Request):string|undefined{
        const[type,token]=request.headers.authorization?.split(' ')??[];
        return type==='Bearer'? token:undefined;
    }
}