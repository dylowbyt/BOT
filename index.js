const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const express = require("express");

const { handleAI } = require("./ai");
const { PREFIX } = require("./config");

// load commands
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

// ===== WHATSAPP CLIENT
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  qrCodeData = qr;
  console.log("QR ready, buka link Railway lu");
});

client.on("ready", () => {
  console.log("Bot siap!");
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

  // ===== AI CHAT (PRIVATE AUTO)
  if (!msg.from.includes("@g.us")) {
    const reply = await handleAI(msg.from, text);
    return msg.reply(reply);
  }

  // ===== GROUP RULE
  if (msg.from.includes("@g.us")) {
    if (msg.hasQuotedMsg) {
      const reply = await handleAI(msg.from, text);
      return msg.reply(reply);
    }
  }
});

client.initialize();

// ===== START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Web QR jalan di port " + PORT);
});
