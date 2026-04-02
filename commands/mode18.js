const { setMode18 } = require("../ai");

module.exports = {
  name: "mode18",
  execute: async (sock, msg, args) => {
    const sender = msg.key.remoteJid;
    const state = args[0] === "on";

    setMode18(sender, state);

    await sock.sendMessage(sender, {
      text: state
        ? "Mode 18+ aktif 🔥"
        : "Mode 18+ mati ❄️",
    });
  },
};
