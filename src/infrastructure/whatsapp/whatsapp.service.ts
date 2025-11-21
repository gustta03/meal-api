import { IWhatsAppRepository } from "@domain/repositories/whatsapp.repository";
import { makeWhatsAppRepository } from "../factories/repositories/whatsapp-repository-factory";
import { makeMessageHandler } from "../factories/handlers/message-handler-factory";

export class WhatsAppService {
  private repository: IWhatsAppRepository;
  private messageHandler = makeMessageHandler();

  constructor() {
    this.repository = makeWhatsAppRepository();
    this.setupMessageHandler();
  }

  private setupMessageHandler(): void {
    this.repository.onMessage(async (message) => {
      await this.messageHandler.handle(message);
    });
  }

  async start(): Promise<void> {
    await this.repository.start();
  }

  async stop(): Promise<void> {
    await this.repository.stop();
  }

  isConnected(): boolean {
    return this.repository.isConnected();
  }
}

