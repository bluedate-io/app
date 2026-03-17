// ─── WaInteractiveService ─────────────────────────────────────────────────────
// Sends WhatsApp messages via Twilio REST API.
// Supports plain text, quick-reply buttons (≤3), and list-picker (≤10).
// Interactive templates are created lazily via Content API and SIDs are cached.

import twilio from "twilio";
import {
  ContentCreateRequest,
  Types,
  TwilioQuickReply,
  TwilioListPicker,
  QuickReplyAction,
  ListItem,
} from "twilio/lib/rest/content/v1/content";
import { config } from "@/config";
import { logger } from "@/utils/logger";

const log = logger.child("WaInteractiveService");

// ─── Message types ────────────────────────────────────────────────────────────

export type WaTextMsg = { type: "text"; body: string };

export type WaButtonsMsg = {
  type: "buttons";
  body: string;
  buttons: string[]; // 2–3 items
};

export type WaListMsg = {
  type: "list";
  body: string;
  items: string[]; // 2–10 items
  buttonLabel?: string;
};

export type WaMessage = WaTextMsg | WaButtonsMsg | WaListMsg;

// ─── Service ──────────────────────────────────────────────────────────────────

export class WaInteractiveService {
  private readonly client: ReturnType<typeof twilio>;
  private readonly from: string;
  private readonly sidCache = new Map<string, string>(); // friendlyName → contentSid

  constructor() {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    this.from = config.twilio.whatsappNumber;
  }

  async send(to: string, msg: WaMessage): Promise<void> {
    if (msg.type === "text") {
      await this.client.messages.create({ from: this.from, to, body: msg.body });
      return;
    }

    try {
      const items = msg.type === "buttons" ? msg.buttons : msg.items;
      const sid =
        msg.type === "buttons"
          ? await this.getButtonTemplate(items.length)
          : await this.getListTemplate(items.length);

      const vars: Record<string, string> = { "1": msg.body };
      items.forEach((item, i) => {
        vars[String(i + 2)] = item;
      });

      await this.client.messages.create({
        from: this.from,
        to,
        contentSid: sid,
        contentVariables: JSON.stringify(vars),
      });
    } catch (err) {
      log.error("Interactive send failed, falling back to text", { err });
      await this.client.messages.create({
        from: this.from,
        to,
        body: this.toPlainText(msg),
      });
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private toPlainText(msg: WaMessage): string {
    if (msg.type === "text") return msg.body;
    const items = msg.type === "buttons" ? msg.buttons : msg.items;
    const opts = items.map((item, i) => `*${i + 1}* — ${item}`).join("\n");
    return `${msg.body}\n\n${opts}\n\n_Reply *0* to go back_`;
  }

  // ─── Template management ─────────────────────────────────────────────────────

  private async getButtonTemplate(count: number): Promise<string> {
    const key = `bluedate_qr_${count}`;
    const cached = this.sidCache.get(key);
    if (cached) return cached;

    const existing = await this.findTemplate(key);
    if (existing) {
      this.sidCache.set(key, existing);
      return existing;
    }

    const vars: Record<string, string> = { "1": "body" };
    const actions: QuickReplyAction[] = [];
    for (let i = 0; i < count; i++) {
      vars[String(i + 2)] = `option${i + 1}`;
      actions.push(new QuickReplyAction({ title: `{{${i + 2}}}`, id: `{{${i + 2}}}` }));
    }

    const request = new ContentCreateRequest({
      friendlyName: key,
      language: "en",
      variables: vars,
      types: new Types({ twilioQuickReply: new TwilioQuickReply({ body: "{{1}}", actions }) }),
    });

    const content = await this.client.content.v1.contents.create(request);
    this.sidCache.set(key, content.sid);
    log.info("Created quick-reply template", { key, sid: content.sid });
    return content.sid;
  }

  private async getListTemplate(count: number): Promise<string> {
    const key = `bluedate_list_${count}`;
    const cached = this.sidCache.get(key);
    if (cached) return cached;

    const existing = await this.findTemplate(key);
    if (existing) {
      this.sidCache.set(key, existing);
      return existing;
    }

    const vars: Record<string, string> = { "1": "body" };
    const items: ListItem[] = [];
    for (let i = 0; i < count; i++) {
      vars[String(i + 2)] = `item${i + 1}`;
      items.push(new ListItem({ id: String(i + 1), item: `{{${i + 2}}}` }));
    }

    const request = new ContentCreateRequest({
      friendlyName: key,
      language: "en",
      variables: vars,
      types: new Types({
        twilioListPicker: new TwilioListPicker({ body: "{{1}}", button: "Choose", items }),
      }),
    });

    const content = await this.client.content.v1.contents.create(request);
    this.sidCache.set(key, content.sid);
    log.info("Created list-picker template", { key, sid: content.sid });
    return content.sid;
  }

  private async findTemplate(friendlyName: string): Promise<string | null> {
    try {
      const contents = await this.client.content.v1.contents.list({ limit: 200 });
      const found = contents.find((c) => c.friendlyName === friendlyName);
      return found?.sid ?? null;
    } catch {
      return null;
    }
  }
}
