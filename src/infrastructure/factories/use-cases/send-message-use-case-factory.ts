import { SendMessageUseCase } from "@application/use-cases/send-message.use-case";
import { getSharedWhatsAppRepository } from "../../whatsapp/whatsapp.service";

export const makeSendMessageUseCase = (): SendMessageUseCase => {
  return new SendMessageUseCase(getSharedWhatsAppRepository());
};

