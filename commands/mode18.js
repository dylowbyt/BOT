const { setMode18 } = require("../18");

module.exports = {
  name: "mode18",
  execute: async (client, msg, args) => {
    const userId = msg.from;
    const state = args[0] === "on";

    setMode18(userId, state);

    await msg.reply(
      state
        ? "Mode 18+ aktif 🔥"
        : "Mode 18+ dimatikan ❄️"
    );
  },
};
