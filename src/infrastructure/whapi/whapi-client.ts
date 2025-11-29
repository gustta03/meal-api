import { CONFIG } from "@shared/constants/config.constants";
import { logger } from "@shared/logger/logger";
import { WhapiSendMessageRequest, WhapiSendMessageResponse, WhapiChannel } from "./types/whapi.types";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";

export class WhapiClient {
  private readonly apiUrl: string;
  private readonly apiToken: string;
  private readonly channelId: string;

  constructor(apiUrl?: string, apiToken?: string, channelId?: string) {
    this.apiUrl = apiUrl || CONFIG.WHAPI.API_URL;
    this.apiToken = apiToken || CONFIG.WHAPI.API_TOKEN || "";
    this.channelId = channelId || CONFIG.WHAPI.CHANNEL_ID || "";

    if (!this.apiToken) {
      logger.warn("WHAPI_API_TOKEN not configured");
    }
    if (!this.channelId) {
      logger.warn("WHAPI_CHANNEL_ID not configured");
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      "Authorization": `Bearer ${this.apiToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    
    try {
      logger.debug({ url, method: options.method || "GET" }, "Whapi API request");

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            url,
          },
          "Whapi API request failed"
        );
        throw new Error(`Whapi API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      logger.error({ error, url }, "Whapi API request error");
      throw error;
    }
  }

  async sendMessage(request: WhapiSendMessageRequest): Promise<WhapiSendMessageResponse> {
    const endpoint = `/messages?channel_id=${this.channelId}`;
    
    const payload: WhapiSendMessageRequest = {
      to: request.to,
      body: request.body,
      media: request.media,
      preview_url: request.preview_url || false,
    };

    return this.request<WhapiSendMessageResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async sendTextMessage(to: string, message: string): Promise<void> {
    try {
      const response = await this.sendMessage({
        to,
        body: message,
      });
      logger.info({ to, messageId: response.messages[0]?.id }, "Message sent via Whapi");
    } catch (error) {
      logger.error({ error, to }, "Failed to send text message via Whapi");
      throw error;
    }
  }

  async sendImage(
    to: string,
    imageBuffer: Buffer,
    caption?: string,
    mimeType: string = "image/png"
  ): Promise<void> {
    try {
      const base64Image = imageBuffer.toString("base64");
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      const response = await this.sendMessage({
        to,
        media: {
          type: "image",
          media: dataUri,
          mimetype: mimeType,
          caption: caption || "",
        },
      });

      logger.info({ to, messageId: response.messages[0]?.id }, "Image sent via Whapi");
    } catch (error) {
      logger.error({ error, to }, "Failed to send image via Whapi");
      throw error;
    }
  }

  async getChannelStatus(): Promise<WhapiChannel | null> {
    try {
      if (!this.channelId) {
        logger.warn("WHAPI_CHANNEL_ID not configured, cannot check channel status");
        return null;
      }

      // Try health endpoint first (more reliable)
      try {
        const healthEndpoint = `/health?channel_id=${this.channelId}`;
        const healthResponse = await this.request<any>(healthEndpoint, {
          method: "GET",
        });
        
        if (healthResponse && healthResponse.status) {
          return {
            id: this.channelId,
            name: healthResponse.name || "Unknown",
            status: healthResponse.status === "connected" ? "connected" : "disconnected",
          };
        }
      } catch (healthError) {
        logger.debug({ error: healthError }, "Health endpoint failed, trying channels endpoint");
      }

      // Fallback to channels endpoint
      const endpoint = `/channels/${this.channelId}`;
      const channel = await this.request<WhapiChannel>(endpoint, {
        method: "GET",
      });

      return channel;
    } catch (error) {
      logger.debug({ error }, "Failed to get channel status from Whapi (this is not critical)");
      return null;
    }
  }

  isConfigured(): boolean {
    return !!(this.apiToken && this.channelId);
  }
}

