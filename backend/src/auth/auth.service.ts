import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim();

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      throw new ConflictException('Email or username is already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // select = never send passwordHash back
    return this.prisma.user.create({
      data: { email, username, passwordHash },
      select: { id: true, email: true, username: true, xp: true },
    });
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordOk =
      user !== null && (await bcrypt.compare(dto.password, user.passwordHash));

    if (user === null || !passwordOk) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({ sub: user.id });
    return { accessToken };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, xp: true, attemptsLeft: true, lockedUntil: true, role: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async refresh(userId:string){
    // make sure the user still exists (a deleted user shouldn't get a new token)
    const user= await this.prisma.user.findUnique({
      where:{id:userId},
      select:{id:true},
    });
    if(!user){
      throw new UnauthorizedException('User no longer exists');
    }
    const accessToken=await this.jwtService.signAsync({sub:user.id});
    return {accessToken};
  }
}