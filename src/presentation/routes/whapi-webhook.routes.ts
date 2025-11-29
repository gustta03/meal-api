import { Elysia } from "elysia";
import { getSharedWhatsAppRepository } from "../../infrastructure/whatsapp/whatsapp.service";
import { logger } from "@shared/logger/logger";
import { WhapiWebhookPayload, WhapiMessage } from "../../infrastructure/whapi/types/whapi.types";
import { WhapiWhatsAppRepository } from "../../infrastructure/whapi/whapi-whatsapp.repository";

export function createWhapiWebhookRoutes() {
  return new Elysia()
    .post("/webhook/whapi", async ({ body }) => {
      try {
        const payload = body as WhapiWebhookPayload;
        
        logger.debug(
          {
            event: payload.event,
            hasMessages: !!payload.messages,
            hasMessage: !!payload.message,
          },
          "Whapi webhook received"
        );

        if (payload.event === "messages") {
          const repository = getSharedWhatsAppRepository();
          
          if (!(repository instanceof WhapiWhatsAppRepository)) {
            logger.warn("Repository is not WhapiWhatsAppRepository, cannot process incoming messages");
            return { status: "error", error: "Invalid repository type" };
          }
          
          if (payload.messages && Array.isArray(payload.messages)) {
            for (const message of payload.messages) {
              await processWhapiMessage(message, repository);
            }
          } else if (payload.message) {
            await processWhapiMessage(payload.message, repository);
          }
        }

        return { status: "ok" };
      } catch (error) {
        logger.error({ error, body }, "Error processing Whapi webhook");
        return { status: "error", error: error instanceof Error ? error.message : "Unknown error" };
      }
    })
    .get("/webhook/whapi", ({ query }) => {
      const mode = query["hub.mode"];
      const token = query["hub.verify_token"];
      const challenge = query["hub.challenge"];

      logger.debug({ mode, token, challenge }, "Whapi webhook verification");

      const verifyToken = process.env.WHAPI_WEBHOOK_VERIFY_TOKEN;

      if (mode === "subscribe" && token === verifyToken) {
        logger.info("Whapi webhook verified successfully");
        return challenge;
      }

      logger.warn({ mode, hasToken: !!token, expectedToken: !!verifyToken }, "Whapi webhook verification failed");
      return new Response("Forbidden", { status: 403 });
    });
}

async function processWhapiMessage(
  whapiMessage: WhapiMessage,
  repository: WhapiWhatsAppRepository
): Promise<void> {
  try {
    if (whapiMessage.type !== "text" && whapiMessage.type !== "image") {
      logger.debug({ type: whapiMessage.type }, "Message type not supported, skipping");
      return;
    }

    if (whapiMessage.context?.from) {
      logger.debug({ from: whapiMessage.context.from }, "Message is a reply, skipping");
      return;
    }

    await repository.processIncomingMessage(whapiMessage);
  } catch (error) {
    logger.error({ error, whapiMessage }, "Failed to process Whapi message");
  }
}

