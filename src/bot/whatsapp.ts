import { createRequire } from "module";
import { logger } from "../lib/logger.js";
import { generateAIResponse } from "./ai.js";
import { createStickerMedia } from "./sticker.js";
import { setQR, setAuthenticated, setReady, setDisconnected } from "./qr-state.js";

const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js") as {
  Client: new (opts: Record<string, unknown>) => WWebClient;
  LocalAuth: new (opts?: Record<string, unknown>) => unknown;
  MessageMedia: new (mimetype: string, data: string, filename?: string) => WWebMedia;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const qrcodeTerminal = require("qrcode-terminal") as {
  generate: (qr: string, opts?: { small?: boolean }) => void;
};

interface WWebMedia {
  mimetype: string;
  data: string;
  filename?: string;
}

interface WWebMessage {
  from: string;
  body: string;
  type: string;
  fromMe: boolean;
  hasMedia: boolean;
  hasQuotedMsg: boolean;
  id: { id: string };
  downloadMedia(): Promise<WWebMedia>;
  getQuotedMessage(): Promise<WWebMessage>;
  getChat(): Promise<WWebChat>;
  reply(text: string): Promise<unknown>;
}

interface WWebChat {
  isGroup: boolean;
  sendMessage(media: WWebMedia, opts?: Record<string, unknown>): Promise<unknown>;
}

interface WWebClient {
  info: { wid: { user: string; _serialized: string }; pushname: string };
  on(event: string, cb: (...args: unknown[]) => void): void;
  initialize(): Promise<void>;
}

const BOT_START_MESSAGE =
  "Halo! Aku adalah AI assistant 🤖\n\nDi *chat pribadi*, kamu bisa ngobrol bebas denganku.\nDi *grup*, gunakan command `/` atau reply pesanku.\n\nCommand tersedia:\n/start - Tampilkan pesan ini\n/stiker - Buat stiker dari gambar\n/reset - Reset percakapan";

async function handleStickerCommand(msg: WWebMessage): Promise<void> {
  let rawMedia: WWebMedia | null = null;

  if (msg.hasMedia) {
    rawMedia = await msg.downloadMedia();
  } else if (msg.hasQuotedMsg) {
    const quoted = await msg.getQuotedMessage();
    if (quoted.hasMedia) {
      rawMedia = await quoted.downloadMedia();
    }
  }

  if (!rawMedia) {
    await msg.reply(
      "Kirim gambar dengan caption `/stiker` atau reply ke gambar dengan `/stiker` untuk membuat stiker!",
    );
    return;
  }

  if (!rawMedia.mimetype.startsWith("image/")) {
    await msg.reply("Hanya file gambar yang bisa dijadikan stiker!");
    return;
  }

  await msg.reply("Memproses stiker... ⏳");

  const stickerData = await createStickerMedia(rawMedia);
  if (!stickerData) {
    await msg.reply("Gagal membuat stiker. Coba lagi ya!");
    return;
  }

  const stickerMedia = new MessageMedia(stickerData.mimetype, stickerData.data, stickerData.filename);
  const chat = await msg.getChat();
  await chat.sendMessage(stickerMedia, { sendMediaAsSticker: true });
}

async function processCommand(
  msg: WWebMessage,
  command: string,
  args: string,
): Promise<void> {
  const cmd = command.toLowerCase().split("@")[0]!;

  if (cmd === "/stiker") {
    await handleStickerCommand(msg);
    return;
  }

  if (cmd === "/reset") {
    const { clearSession } = await import("./ai.js");
    clearSession(msg.from);
    await msg.reply("Percakapan sudah direset! Kita mulai dari awal ya 😊");
    return;
  }

  if (cmd === "/start") {
    await msg.reply(BOT_START_MESSAGE);
    return;
  }

  const fullText = args ? `${cmd} ${args}` : cmd;
  const response = await generateAIResponse(msg.from, fullText);
  await msg.reply(response);
}

async function handleMessage(msg: WWebMessage): Promise<void> {
  try {
    if (msg.fromMe) return;
    if (msg.type === "revoked") return;

    const chat = await msg.getChat();
    const isGroup = chat.isGroup;
    const body = msg.body?.trim() ?? "";

    if (isGroup) {
      const isCommand = body.startsWith("/");
      let isQuotedBot = false;
      if (msg.hasQuotedMsg) {
        const quoted = await msg.getQuotedMessage();
        isQuotedBot = quoted.fromMe === true;
      }

      if (!isCommand && !isQuotedBot) return;

      if (isCommand) {
        const parts = body.split(" ");
        const command = parts[0]!;
        const args = parts.slice(1).join(" ");
        await processCommand(msg, command, args);
      } else {
        const response = await generateAIResponse(msg.from, body);
        await msg.reply(response);
      }
    } else {
      if (body.startsWith("/")) {
        const parts = body.split(" ");
        const command = parts[0]!;
        const args = parts.slice(1).join(" ");
        await processCommand(msg, command, args);
      } else if (body.length > 0) {
        const response = await generateAIResponse(msg.from, body);
        await msg.reply(response);
      }
    }
  } catch (err) {
    logger.error({ err, msgId: msg.id?.id }, "Error handling message");
  }
}

export function createWhatsAppBot(): WWebClient {
  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: ".wwebjs_auth",
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--single-process",
      ],
    },
  });

  client.on("qr", (qr: unknown) => {
    const qrStr = qr as string;
    setQR(qrStr);
    logger.info("QR Code baru diterima - buka /qr di browser untuk scan");
    console.log("\n========================================");
    console.log("  SCAN QR CODE INI DENGAN WHATSAPP KAMU");
    console.log("  Atau buka: /qr di browser");
    console.log("========================================\n");
    qrcodeTerminal.generate(qrStr, { small: true });
    console.log("\n========================================\n");
  });

  client.on("ready", () => {
    const info = client.info;
    setReady(info.wid.user, info.pushname);
    logger.info({ phone: info.wid.user, name: info.pushname }, "WhatsApp bot siap digunakan!");
    console.log(`\n✅ Bot aktif sebagai: ${info.pushname} (+${info.wid.user})\n`);
  });

  client.on("authenticated", () => {
    setAuthenticated();
    logger.info("WhatsApp berhasil diautentikasi");
  });

  client.on("auth_failure", (msg: unknown) => {
    setDisconnected();
    logger.error({ msg }, "Autentikasi WhatsApp gagal");
  });

  client.on("disconnected", (reason: unknown) => {
    setDisconnected();
    logger.warn({ reason }, "WhatsApp terputus");
  });

  client.on("message", (msg: unknown) => {
    void handleMessage(msg as WWebMessage);
  });

  client.initialize().catch((err: unknown) => {
    logger.error({ err }, "Gagal menginisialisasi WhatsApp client");
  });

  return client;
}
