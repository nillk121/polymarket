import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectChannelDto } from './dto/connect-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Подключение канала администратором
   */
  async connectChannel(userId: string, connectChannelDto: ConnectChannelDto) {
    // Проверка существования канала
    const existing = await this.prisma.telegramChannel.findUnique({
      where: { channelId: connectChannelDto.channelId },
    });

    if (existing) {
      throw new ConflictException('Канал уже подключен');
    }

    // Создание канала
    return this.prisma.telegramChannel.create({
      data: {
        channelId: connectChannelDto.channelId,
        channelUsername: connectChannelDto.channelUsername,
        channelTitle: connectChannelDto.channelTitle,
        channelType: connectChannelDto.channelType || 'channel',
        isActive: connectChannelDto.isActive ?? true,
      },
    });
  }

  /**
   * Получение всех каналов
   */
  async findAll(includeInactive: boolean = false) {
    return this.prisma.telegramChannel.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });
  }

  /**
   * Получение одного канала
   */
  async findOne(id: string) {
    const channel = await this.prisma.telegramChannel.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Канал не найден');
    }

    return channel;
  }

  /**
   * Обновление канала
   */
  async update(id: string, updateChannelDto: UpdateChannelDto) {
    const channel = await this.findOne(id);

    return this.prisma.telegramChannel.update({
      where: { id },
      data: updateChannelDto,
    });
  }

  /**
   * Удаление канала
   */
  async remove(id: string) {
    const channel = await this.findOne(id);

    return this.prisma.telegramChannel.delete({
      where: { id },
    });
  }

  /**
   * Получение канала по channelId
   */
  async findByChannelId(channelId: string) {
    return this.prisma.telegramChannel.findUnique({
      where: { channelId },
    });
  }

  /**
   * Обновление статистики канала
   */
  async updateStats(channelId: string, stats: { subscriberCount?: number }) {
    const channel = await this.findByChannelId(channelId);
    if (!channel) {
      throw new NotFoundException('Канал не найден');
    }

    return this.prisma.telegramChannel.update({
      where: { channelId },
      data: {
        subscriberCount: stats.subscriberCount ?? channel.subscriberCount,
      },
    });
  }
}

