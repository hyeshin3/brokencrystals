import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { API_DESC_CHAT_QUESTION } from './chat.controller.api.desc';
import { ChatMessage } from './api/ChatMessage';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Controller('/api/chat')
@ApiTags('Chat controller')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('/query')
  @ApiOperation({ description: API_DESC_CHAT_QUESTION })
  @ApiBody({
    description: 'A list of messages comprising the conversation so far',
    type: [ChatMessage]
  })
  @ApiOkResponse({
    description: 'Chatbot answer',
    type: String
  })
  async query(@Body() messages: ChatMessage[]): Promise<string> {
    try {
      // Validate and sanitize the input
      const validatedMessages = plainToInstance(ChatMessage, messages);
      const errors = await validate(validatedMessages);

      if (errors.length > 0) {
        throw new HttpException('Invalid input', HttpStatus.BAD_REQUEST);
      }

      // Pass the sanitized input to the service
      return await this.chatService.query(validatedMessages);
    } catch (err) {
      throw new HttpException(
        `Chat API response error: ${err}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
