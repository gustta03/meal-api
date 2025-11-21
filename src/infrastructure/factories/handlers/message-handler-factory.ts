import { MessageHandler } from "@presentation/handlers/message.handler";
import { makeProcessMessageUseCase } from "../use-cases/process-message-use-case-factory";
import { makeSendMessageUseCase } from "../use-cases/send-message-use-case-factory";

export const makeMessageHandler = (): MessageHandler => {
  return new MessageHandler(
    makeProcessMessageUseCase(),
    makeSendMessageUseCase()
  );
};

