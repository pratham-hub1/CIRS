import {
  Controller,
  Post,
  Req,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { FilesService } from './files.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Roles('AUTHENTICATED')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(@Req() req: FastifyRequest) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    const data = await req.file();
    if (!data) {
      throw new BadRequestException('No file uploaded');
    }

    const buffer = await data.toBuffer();
    const result = await this.filesService.saveFile(
      data.filename,
      data.mimetype,
      buffer,
    );

    return result;
  }
}
