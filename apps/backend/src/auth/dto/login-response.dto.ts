export class LoginResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    telegramId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
    permissions: string[];
  };
}

