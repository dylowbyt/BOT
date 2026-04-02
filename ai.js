const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const userMode = {};

async function handleAI(userId, message) {
  const mode18 = userMode[userId] || false;

  let system = "Kamu AI santai.";

  if (mode18) {
    system += " Mode 18+ aktif.";
  }

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: message },
    ],
  });

  return res.choices[0].message.content;
}

function setMode18(userId, state) {
  userMode[userId] = state;
}

module.exports = { handleAI, setMode18 };
