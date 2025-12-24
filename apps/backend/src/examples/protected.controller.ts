import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RolesPermissionsInterceptor } from '../auth/interceptors/roles-permissions.interceptor';

/**
 * Пример контроллера с различными уровнями защиты
 */
@Controller('examples')
@UseGuards(JwtAuthGuard)
@UseInterceptors(RolesPermissionsInterceptor)
export class ProtectedController {
  /**
   * Публичный endpoint (не требует аутентификации)
   */
  @Get('public')
  @Public()
  getPublic() {
    return {
      message: 'Это публичный endpoint, доступен всем',
    };
  }

  /**
   * Защищенный endpoint (требует аутентификации)
   */
  @Get('protected')
  getProtected(@CurrentUser() user: any) {
    return {
      message: 'Это защищенный endpoint',
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
      },
    };
  }

  /**
   * Endpoint только для админов
   */
  @Get('admin-only')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getAdminOnly(@CurrentUser() user: any) {
    return {
      message: 'Этот endpoint доступен только администраторам',
      user: {
        id: user.id,
        roles: user.jwtRoles,
      },
    };
  }

  /**
   * Endpoint для админов и модераторов
   */
  @Get('admin-moderator')
  @UseGuards(RolesGuard)
  @Roles('admin', 'moderator')
  getAdminModerator(@CurrentUser() user: any) {
    return {
      message: 'Доступен админам и модераторам',
      user: {
        id: user.id,
        roles: user.jwtRoles,
      },
    };
  }

  /**
   * Endpoint с проверкой разрешения
   */
  @Post('create-market')
  @UseGuards(PermissionsGuard)
  @Permissions('market:create')
  createMarket(@CurrentUser() user: any) {
    return {
      message: 'Создание рынка (требует разрешение market:create)',
      user: {
        id: user.id,
        permissions: user.jwtPermissions,
      },
    };
  }

  /**
   * Endpoint с комбинацией роли и разрешения
   */
  @Post('resolve-market')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('admin', 'moderator')
  @Permissions('market:resolve')
  resolveMarket(@CurrentUser() user: any) {
    return {
      message: 'Разрешение рынка (требует роль admin/moderator И разрешение market:resolve)',
      user: {
        id: user.id,
        roles: user.jwtRoles,
        permissions: user.jwtPermissions,
      },
    };
  }

  /**
   * Endpoint с информацией о текущем пользователе
   */
  @Get('my-info')
  getMyInfo(@CurrentUser() user: any) {
    return {
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.jwtRoles || [],
        permissions: user.jwtPermissions || [],
        isAdmin: user.jwtRoles?.includes('admin') || false,
      },
    };
  }
}

