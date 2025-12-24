import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Декоратор для получения текущего пользователя из request
 * @example
 * @Get('profile')
 * async getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

