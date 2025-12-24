export class LoginResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    telegramId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    roles: string[];
    permissions: string[];
  };
}

