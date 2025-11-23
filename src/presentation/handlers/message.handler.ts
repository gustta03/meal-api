import { Message } from "@domain/entities/message.entity";
import { ProcessMessageUseCase } from "@application/use-cases/process-message.use-case";
import { SendMessageUseCase } from "@application/use-cases/send-message.use-case";
import { SendMessageDto } from "@application/dtos/message.dto";

export class MessageHandler {
  constructor(
    private readonly processMessageUseCase: ProcessMessageUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase
  ) {}

  async handle(message: Message): Promise<void> {
    const result = await this.processMessageUseCase.execute(message);

    if (result.success) {
      const sendDto: SendMessageDto = {
        to: message.from,
        message: result.data.message,
        imageBuffer: result.data.imageBuffer,
        imageMimeType: result.data.imageMimeType,
      };

      await this.sendMessageUseCase.execute(sendDto);
    }
  }
}

