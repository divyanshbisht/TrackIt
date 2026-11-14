const { OpenAI } = require('openai');

const apiKey = process.env.OPENAI_API_KEY;

let openai = null;
if (apiKey && apiKey !== 'your_openai_api_key_here') {
  try {
    openai = new OpenAI({ apiKey });
  } catch (err) {
    console.warn('[OpenAI Warning] Failed to initialize OpenAI client:', err.message);
  }
} else {
  console.warn('[OpenAI Warning] No valid OPENAI_API_KEY detected. AI controller will use smart deterministic fallback parser.');
}

const isOpenAIConfigured = () => Boolean(openai && openai.apiKey);

module.exports = { openai, isOpenAIConfigured };
