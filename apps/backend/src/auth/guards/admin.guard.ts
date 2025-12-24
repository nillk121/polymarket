import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      return false;
    }

    // Проверяем наличие роли admin
    if (user.isAdmin) {
      return true;
    }

    if (user.roles) {
      // Если roles - массив строк
      if (Array.isArray(user.roles) && user.roles.includes('admin')) {
        return true;
      }
      
      // Если roles - массив объектов из БД
      if (Array.isArray(user.roles) && user.roles.length > 0 && typeof user.roles[0] === 'object') {
        return user.roles.some(
          (userRole: any) => userRole.role?.name === 'admin',
        );
      }
    }

    return false;
  }
}
