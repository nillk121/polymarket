import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * WebSocket Gateway для real-time обновлений ставок
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/bets',
})
export class BetsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BetsGateway.name);
  private connectedUsers = new Map<string, Socket>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Обработка подключения клиента
   */
  async handleConnection(client: Socket) {
    try {
      // Аутентификация через JWT токен
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Сохраняем связь userId -> socket
      this.connectedUsers.set(payload.sub, client);
      client.data.userId = payload.sub;

      // Присоединяем к комнате пользователя
      client.join(`user:${payload.sub}`);

      this.logger.log(`User ${payload.sub} connected to bets gateway`);
    } catch (error) {
      this.logger.error('WebSocket authentication error:', error);
      client.disconnect();
    }
  }

  /**
   * Обработка отключения клиента
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`User ${userId} disconnected from bets gateway`);
    }
  }

  /**
   * Подписка на обновления рынка
   */
  @SubscribeMessage('subscribe:market')
  handleSubscribeMarket(
    @MessageBody() data: { marketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    client.join(`market:${data.marketId}`);
    return { success: true, marketId: data.marketId };
  }

  /**
   * Отписка от обновлений рынка
   */
  @SubscribeMessage('unsubscribe:market')
  handleUnsubscribeMarket(
    @MessageBody() data: { marketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`market:${data.marketId}`);
    return { success: true, marketId: data.marketId };
  }

  /**
   * Отправка обновления о новой ставке
   */
  emitBetPlaced(bet: any) {
    // Отправка пользователю, разместившему ставку
    this.server.to(`user:${bet.userId}`).emit('bet:placed', bet);

    // Отправка всем подписанным на рынок
    this.server.to(`market:${bet.marketId}`).emit('bet:new', {
      betId: bet.id,
      marketId: bet.marketId,
      outcomeId: bet.outcomeId,
      shares: bet.shares,
      price: bet.price,
      totalCost: bet.totalCost,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Отправка обновления о отмене ставки
   */
  emitBetCancelled(bet: any) {
    this.server.to(`user:${bet.userId}`).emit('bet:cancelled', bet);
    this.server.to(`market:${bet.marketId}`).emit('bet:cancelled', {
      betId: bet.id,
      marketId: bet.marketId,
    });
  }

  /**
   * Отправка обновления о разрешении рынка
   */
  emitMarketResolved(marketId: string, resolvedOutcomeId: string) {
    this.server.to(`market:${marketId}`).emit('market:resolved', {
      marketId,
      resolvedOutcomeId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Отправка обновления цен исходов
   */
  emitPriceUpdate(marketId: string, prices: Record<string, number>) {
    this.server.to(`market:${marketId}`).emit('market:prices', {
      marketId,
      prices,
      timestamp: new Date().toISOString(),
    });
  }
}

