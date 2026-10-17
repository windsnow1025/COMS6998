import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AdminService } from './admin.service';
import {
  AdminCaptionReqDto,
  AdminPhotosReqDto,
  AdminVotesReqDto,
} from './dto/admin.req.dto';
import {
  AdminCaptionResDto,
  AdminLlmCallResDto,
  AdminOverviewResDto,
  AdminPhotoDetailResDto,
  AdminPhotoPageResDto,
  AdminUserResDto,
  AdminVotePageResDto,
} from './dto/admin.res.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @Roles([Role.Admin])
  async findOverview(): Promise<AdminOverviewResDto> {
    return await this.adminService.findOverview();
  }

  @Get('users')
  @Roles([Role.Admin])
  async findUsers(): Promise<AdminUserResDto[]> {
    return await this.adminService.findUsers();
  }

  @Get('photos')
  @Roles([Role.Admin])
  async findPhotos(
    @Query(new ValidationPipe({ transform: true }))
    adminPhotosReqDto: AdminPhotosReqDto,
  ): Promise<AdminPhotoPageResDto> {
    const { offset, limit, q } = adminPhotosReqDto;
    return await this.adminService.findPhotos(
      offset,
      limit,
      q?.trim() || undefined,
    );
  }

  @Get('photos/:id')
  @Roles([Role.Admin])
  async findPhoto(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminPhotoDetailResDto> {
    return await this.adminService.findPhoto(id);
  }

  @Get('votes')
  @Roles([Role.Admin])
  async findVotes(
    @Query(new ValidationPipe({ transform: true }))
    adminVotesReqDto: AdminVotesReqDto,
  ): Promise<AdminVotePageResDto> {
    const { offset, limit } = adminVotesReqDto;
    return await this.adminService.findVotes(offset, limit);
  }

  @Get('llm-calls/:id')
  @Roles([Role.Admin])
  async findLlmCall(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminLlmCallResDto> {
    return await this.adminService.findLlmCall(id);
  }

  @Patch('captions/:id')
  @Roles([Role.Admin])
  async updateCaption(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() adminCaptionReqDto: AdminCaptionReqDto,
  ): Promise<AdminCaptionResDto> {
    return await this.adminService.updateCaption(
      id,
      adminCaptionReqDto.content,
    );
  }

  @Delete('captions/:id')
  @Roles([Role.Admin])
  async removeCaption(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.adminService.removeCaption(id);
  }
}
