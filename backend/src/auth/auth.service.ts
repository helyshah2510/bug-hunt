import {
  Injectable,
  ConflictException,
  UnauthorizedException,
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
  ) {}

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
}