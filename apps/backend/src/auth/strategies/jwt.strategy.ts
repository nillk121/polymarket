import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Проверяем тип токена (только access токены)
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Неверный тип токена');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Пользователь не найден или неактивен');
    }

    if (user.isBanned) {
      if (user.bannedUntil && user.bannedUntil > new Date()) {
        throw new UnauthorizedException('Пользователь заблокирован');
      } else if (!user.bannedUntil) {
        throw new UnauthorizedException('Пользователь заблокирован');
      }
    }

    // Добавляем роли и разрешения из payload для быстрого доступа
    return {
      ...user,
      jwtRoles: payload.roles || [],
      jwtPermissions: payload.permissions || [],
    };
  }
}
