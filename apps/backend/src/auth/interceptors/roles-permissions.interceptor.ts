import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Интерцептор для добавления информации о ролях и разрешениях в ответ
 */
@Injectable()
export class RolesPermissionsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      map((data) => {
        if (user) {
          return {
            ...data,
            _user: {
              id: user.id,
              roles: user.jwtRoles || [],
              permissions: user.jwtPermissions || [],
            },
          };
        }
        return data;
      }),
    );
  }
}

