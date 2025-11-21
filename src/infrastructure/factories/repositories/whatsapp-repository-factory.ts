import { IWhatsAppRepository } from "@domain/repositories/whatsapp.repository";
import { BaileysWhatsAppRepository } from "../../whatsapp/baileys-whatsapp.repository";

export const makeWhatsAppRepository = (): IWhatsAppRepository => {
  return new BaileysWhatsAppRepository();
};

