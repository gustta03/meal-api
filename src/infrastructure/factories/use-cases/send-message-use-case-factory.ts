import { SendMessageUseCase } from "@application/use-cases/send-message.use-case";
import { makeWhatsAppRepository } from "../repositories/whatsapp-repository-factory";

export const makeSendMessageUseCase = (): SendMessageUseCase => {
  return new SendMessageUseCase(makeWhatsAppRepository());
};

