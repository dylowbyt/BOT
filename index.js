const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode");
const express = require("express");

const { handleAI } = require("./ai");
const { PREFIX } = require("./config");
const mode18 = require("./commands/mode18");

const commands = { mode18 };

// ===== EXPRESS QR LINK
const app = express();
let qrCodeData = "";

app.get("/", async (req, res) => {
  if (!qrCodeData) return res.send("QR belum ada...");
  const qr = await qrcode.toDataURL(qrCodeData);
  res.send(`<img src="${qr}" />`);
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, qr }) => {
    if (qr) {
      qrCodeData = qr;
      console.log("QR READY 🔥 buka link railway");
    }

    if (connection === "open") {
      console.log("BOT CONNECTED ✅");
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    const sender = msg.key.remoteJid;

    // ===== COMMAND
    if (text?.startsWith(PREFIX)) {
      const args = text.slice(1).split(" ");
      const cmd = args.shift().toLowerCase();

      if (commands[cmd]) {
        return commands[cmd].execute(sock, msg, args);
      }
    }

    // ===== PRIVATE AUTO AI
    if (!sender.includes("@g.us")) {
      const reply = await handleAI(sender, text);
      await sock.sendMessage(sender, { text: reply });
    }

    // ===== GROUP (HARUS REPLY)
    if (sender.includes("@g.us")) {
      if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const reply = await handleAI(sender, text);
        await sock.sendMessage(sender, { text: reply });
      }
    }
  });
}

startBot();

// ===== SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("QR Web jalan di " + PORT);
});
