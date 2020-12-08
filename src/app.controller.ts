import {
  Body,
  Controller,
  Get,
  Header,
  Logger,
  Options,
  Post,
  Query,
  Req,
  RequestMapping,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './app.config.api';
import { AppService } from './app.service';
import { AppModuleConfigProperties } from './app.module.config.properties';
import { OrmModuleConfigProperties } from './orm/orm.module.config.properties';
import { get } from 'http';
import { query, Response } from 'express';
import { parseXml } from 'libxmljs';
import * as rawbody from 'raw-body';
import * as dotT from 'dot';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('/api')
@ApiTags('app controller')
export class AppController {
  private log: Logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @ApiBody({
    type: 'text/plain',
    description:
      'Template for rendering by doT. Expects plain text as request body',
  })
  @ApiResponse({
    type: String,
    description: 'Rendered result',
  })
  @Post('render')
  async renderTemplate(@Body() data, @Req() req): Promise<string> {
    if (req.readable) {
      const raw = await rawbody(req);
      const text = raw.toString().trim();
      const res = dotT.compile(text)();
      this.log.debug('rendered template:', res);
      return res;
    }
  }

  @ApiOperation({
    description: 'Redirects the user to the provided url',
  })
  @Get('goto')
  async redirect(@Query('url') url: string, @Res() res: Response) {
    res.redirect(url);
  }

  @ApiOperation({
    description:
      "Receives client's metadata in XML format. Returns the passed XML",
  })
  @Post('metadata')
  @Header('Content-Type', 'text/xml')
  async xml(@Query('xml') xml: string): Promise<string> {
    console.log(xml);
    const xmlDoc = parseXml(xml, {
      dtdload: true,
      noent: false,
      doctype: true,
      dtdvalid: true,
      errors: true,
    });

    this.log.debug(xmlDoc);
    this.log.debug(xmlDoc.getDtd());

    return xmlDoc.toString(true);
  }

  @ApiOperation({
    description: 'Returns the list of supported operations',
  })
  @Options()
  @Header('Allow', 'OPTIONS, GET, HEAD, POST')
  async getTestOptions(): Promise<void> {
    this.log.debug('Called getTestOptions');
  }

  @ApiOperation({
    description: 'Returns server configuration to the client',
  })
  @ApiResponse({
    type: AppConfig,
  })
  @Get('/config')
  getConfig(): AppConfig {
    this.log.debug('Called getConfig');
    const dbSchema = this.configService.get<string>(
      OrmModuleConfigProperties.ENV_DATABASE_SCHEMA,
    );
    const dbHost = this.configService.get<string>(
      OrmModuleConfigProperties.ENV_DATABASE_HOST,
    );
    const dbPort = this.configService.get<string>(
      OrmModuleConfigProperties.ENV_DATABASE_PORT,
    );
    const dbUser = this.configService.get<string>(
      OrmModuleConfigProperties.ENV_DATABASE_USER,
    );
    const dbPwd = this.configService.get<string>(
      OrmModuleConfigProperties.ENV_DATABASE_PASSWORD,
    );
    return {
      awsBucket: this.configService.get<string>(
        AppModuleConfigProperties.ENV_AWS_BUCKET,
      ),
      sql: `postgres://${dbUser}:${dbPwd}@${dbHost}:${dbPort}/${dbSchema} `,
      mailgun: this.configService.get<string>(
        AppModuleConfigProperties.ENV_MAILGUN_API,
      ),
    };
  }
}
