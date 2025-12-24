import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ConnectChannelDto } from './dto/connect-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('channels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  /**
   * Подключение канала
   * POST /channels
   */
  @Post()
  async connectChannel(
    @Body() connectChannelDto: ConnectChannelDto,
    @CurrentUser() user: any,
  ) {
    return this.channelsService.connectChannel(user.id, connectChannelDto);
  }

  /**
   * Получение всех каналов
   * GET /channels
   */
  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.channelsService.findAll(includeInactive === 'true');
  }

  /**
   * Получение одного канала
   * GET /channels/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.channelsService.findOne(id);
  }

  /**
   * Обновление канала
   * PUT /channels/:id
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
    return this.channelsService.update(id, updateChannelDto);
  }

  /**
   * Удаление канала
   * DELETE /channels/:id
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.channelsService.remove(id);
  }
}

