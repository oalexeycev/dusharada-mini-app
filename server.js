const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

// IMPORTANT:
// Do NOT hard-code your token in code.
// Set environment variable TELEGRAM_BOT_TOKEN before starting:
// PowerShell: $env:TELEGRAM_BOT_TOKEN="YOUR_TOKEN"; node server.js
// CMD: set TELEGRAM_BOT_TOKEN=YOUR_TOKEN && node server.js

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Public URL of your mini app (must be HTTPS and reachable from Telegram).
// Example: https://your-domain.com or https://your-ngrok-url.ngrok.io
// Set WEBAPP_URL in env when deploying.
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-domain.com'; // TODO: replace or set env

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files for the mini app
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`Web server listening on http://localhost:${PORT}`);
});

// Initialize Telegram bot with long polling (optional for local play)
if (BOT_TOKEN) {
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Привет! Нажми кнопку ниже, чтобы сыграть в тетрис 🎮', {
      reply_markup: {
        keyboard: [
          [
            {
              text: 'Играть в тетрис',
              web_app: { url: WEBAPP_URL }
            }
          ]
        ],
        resize_keyboard: true
      }
    });
  });

  bot.on('message', (msg) => {
    if (msg.web_app_data) {
      // Here you can handle data sent back from the WebApp if needed
      console.log('Received web_app_data:', msg.web_app_data);
    }
  });

  console.log('Telegram bot started with polling...');
} else {
  console.log('BOT_TOKEN is not set; starting only web server (no Telegram bot).');
}

