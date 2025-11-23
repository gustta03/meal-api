import { IWhatsAppRepository } from "@domain/repositories/whatsapp.repository";
import { SendMessageDto } from "../dtos/message.dto";
import { Result, success, failure } from "@shared/types/result";

export class SendMessageUseCase {
  constructor(private readonly whatsappRepository: IWhatsAppRepository) {}

  async execute(dto: SendMessageDto): Promise<Result<void, string>> {
    try {
      if (dto.imageBuffer) {
        await this.whatsappRepository.sendImage(
          dto.to,
          dto.imageBuffer,
          dto.message,
          dto.imageMimeType || "image/png"
        );
      } else {
        await this.whatsappRepository.sendMessage(dto.to, dto.message);
      }
      return success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      return failure(errorMessage);
    }
  }
}

