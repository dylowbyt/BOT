const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const express = require("express");

const { handleAI } = require("./ai");
const { PREFIX } = require("./config");

// command
const mode18 = require("./commands/mode18");

const commands = {
  mode18,
};

// ===== EXPRESS (QR LINK)
const app = express();
let qrCodeData = "";

app.get("/", async (req, res) => {
  if (!qrCodeData) return res.send("QR belum ready...");
  const qrImage = await qrcode.toDataURL(qrCodeData);
  res.send(`<img src="${qrImage}" />`);
});

// ===== FIX CHROME PATH (RAILWAY)
process.env.CHROME_BIN = "/usr/bin/chromium-browser";

// ===== WHATSAPP CLIENT
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process"
    ]
  }
});

client.on("qr", (qr) => {
  qrCodeData = qr;
  console.log("QR READY - buka link Railway lu");
});

client.on("ready", () => {
  console.log("BOT SIAP 🔥");
});

// ===== MESSAGE HANDLER
client.on("message", async (msg) => {
  const text = msg.body;

  // ===== COMMAND
  if (text.startsWith(PREFIX)) {
    const args = text.slice(1).split(" ");
    const commandName = args.shift().toLowerCase();

    const command = commands[commandName];
    if (command) {
      return command.execute(client, msg, args);
    }
  }

  // ===== PRIVATE CHAT (AUTO AI)
  if (!msg.from.includes("@g.us")) {
    try {
      const reply = await handleAI(msg.from, text);
      return msg.reply(reply);
    } catch (err) {
      return msg.reply("AI error ❌");
    }
  }

  // ===== GROUP (HARUS REPLY ATAU COMMAND)
  if (msg.from.includes("@g.us")) {
    if (msg.hasQuotedMsg) {
      try {
        const reply = await handleAI(msg.from, text);
        return msg.reply(reply);
      } catch (err) {
        return msg.reply("AI error ❌");
      }
    }
  }
});

client.initialize();

// ===== START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Web QR jalan di port " + PORT);
});
