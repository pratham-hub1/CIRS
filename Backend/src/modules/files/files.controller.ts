import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Res,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { FilesService } from './files.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

@Roles('AUTHENTICATED')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthUser,
  ) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    const data = await req.file();
    if (!data) {
      throw new BadRequestException('No file uploaded');
    }

    const buffer = await data.toBuffer();

    // Context from query or multipart field
    const query = req.query as Record<string, any> | undefined;
    const context =
      query?.context ||
      query?.visibility ||
      (data.fields?.context as any)?.value ||
      (data.fields?.visibility as any)?.value;

    const result = await this.filesService.saveFile(
      data.filename,
      data.mimetype,
      buffer,
      user,
      context,
    );

    return result;
  }

  @Get(':id')
  async getFile(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: FastifyReply,
  ) {
    const { file, stream } = await this.filesService.getFileStream(user, id);

    res.type(file.mimeType);
    res.header('Content-Length', file.sizeBytes.toString());
    res.header('Content-Disposition', `inline; filename="${file.storageKey}"`);
    res.header(
      'Cache-Control',
      file.visibility === 'PRIVATE' ? 'private, no-cache' : 'public, max-age=86400',
    );

    return res.send(stream);
  }
}
