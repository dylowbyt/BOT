const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode");
const express = require("express");
const fs = require("fs");

const { handleAI } = require("./ai");
const { PREFIX } = require("./config");
const mode18 = require("./commands/mode18");

const commands = { mode18 };

// ===== RESET SESSION BIAR GAK STUCK
if (fs.existsSync("./session")) {
  fs.rmSync("./session", { recursive: true, force: true });
  console.log("Session lama dihapus 🔥");
}

// ===== EXPRESS QR WEB
const app = express();
let qrCodeData = null;

app.get("/", async (req, res) => {
  if (!qrCodeData) {
    return res.send("QR belum siap, tunggu bentar...");
  }

  try {
    const qrImage = await qrcode.toDataURL(qrCodeData);
    res.send(`
      <h2>Scan QR WhatsApp</h2>
      <img src="${qrImage}" />
    `);
  } catch (err) {
    res.send("QR error");
  }
});

// ===== START BOT
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // WAJIB
    browser: ["Railway Bot", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log("QR DAPET 🔥");
      qrCodeData = qr;
    }

    if (connection === "open") {
      console.log("BOT CONNECTED ✅");
      qrCodeData = null;
    }

    if (connection === "close") {
      console.log("RECONNECTING...");
      startBot();
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    if (!text) return;

    const sender = msg.key.remoteJid;

    console.log("MSG:", text);

    // ===== COMMAND
    if (text.startsWith(PREFIX)) {
      const args = text.slice(1).split(" ");
      const cmd = args.shift().toLowerCase();

      if (commands[cmd]) {
        return commands[cmd].execute(sock, msg, args);
      }
    }

    // ===== PRIVATE AI
    if (!sender.includes("@g.us")) {
      try {
        const reply = await handleAI(sender, text);
        await sock.sendMessage(sender, { text: reply });
      } catch {
        await sock.sendMessage(sender, { text: "AI error ❌" });
      }
    }

    // ===== GROUP (HARUS REPLY)
    if (sender.includes("@g.us")) {
      if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        try {
          const reply = await handleAI(sender, text);
          await sock.sendMessage(sender, { text: reply });
        } catch {
          await sock.sendMessage(sender, { text: "AI error ❌" });
        }
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
