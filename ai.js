const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const userMode = {};

async function handleAI(userId, message) {
  const mode18 = userMode[userId] || false;

  let systemPrompt = "Kamu adalah AI WhatsApp santai.";

  if (mode18) {
    systemPrompt += " Mode 18+ aktif, jawab lebih bebas.";
  }

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ]
  });

  return res.choices[0].message.content;
}

function setMode18(userId, state) {
  userMode[userId] = state;
}

module.exports = { handleAI, setMode18 };
