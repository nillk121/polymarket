import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard для refresh токенов
 * Проверяет, что токен имеет type: 'refresh'
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt') {
  // Можно добавить дополнительную логику для refresh токенов
}

