// routes/telegramBot.js
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const { addJob, getJobs } = require('./sql_base'); // Import the getJobs function

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.warn('⚠️ Telegram bot disabled — TELEGRAM_BOT_TOKEN missing');
  module.exports = { notifyUpload: () => {} };
  return;
}

const escapeMarkdownV2 = (text) =>
  text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

const STORAGE_DIR = path.join(__dirname, '..', 'storage');
const METADATA_DIR = path.join(__dirname, '..', 'metadata');
const JOB_STATUS_QUEUED = 'queued';

function ensureDirs() {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  fs.mkdirSync(METADATA_DIR, { recursive: true });
}

function parseCaption(caption = '') {
  const meta = {};
  caption.split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) meta[key.trim().toLowerCase()] = rest.join(':').trim();
  });
  return meta;
}

function normalizeUploadFilename(original) {
  // Prevent path traversal & normalize weird names from external input.
  const base = path.basename(String(original || 'upload.stl'));
  return base || 'upload.stl';
}

async function downloadTelegramFile(fileId) {
  const fileInfo = await bot.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;

  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  return res.arrayBuffer();
}

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
});

const POLLING_RETRY_MS = 5000;
let restartScheduled = false;


const bot = new TelegramBot(token, {
  polling: {
    autoStart: false,
    interval: 1000,
    params: { timeout: 10 }
  }
});

function startPollingWithRetry() {
  console.log('🌀 Launching bot polling loop...');
  
  function start() {
    restartScheduled = false;
    bot.startPolling()
      .then(() => console.log('🤖 Bot polling started'))
      .catch(err => {
        console.error('❌ Polling failed to start:', err.message);
        setTimeout(start, POLLING_RETRY_MS); // Retry on initial failure
      });
  }

  start();

  // Catch disconnection errors while running
  bot.on('polling_error', (err) => {
    console.error('❌ Polling error occurred:', err.message);
    if (restartScheduled) return;
    restartScheduled = true;

    bot.stopPolling()
      .catch(() => {})
      .finally(() => {
        console.log(`🔁 Restarting polling in ${POLLING_RETRY_MS / 1000}s...`);
        setTimeout(start, POLLING_RETRY_MS);
      });
  });

  bot.on('error', (err) => {
    console.error('❌ Telegram bot error:', err.message || err);
  });
}

startPollingWithRetry();


const DEFAULTS = {
  printer: 'Telegram',
  material: 'Unknown',
  infill: '20%',
  infill_type: 'Grid',
  supports: false,
  perimeters: 2,
  description: 'Uploaded via Telegram'
};

const PRINTERS = [
  'Whatever',
  'Prusa Mini',
  'QIDI 4 Plus',
  'Ender 3 V2',
  'Artillery Sidewinder X2'
];

bot.onText(/\/(start|help)/, (msg) => {
  const chatId = msg.chat.id;

  const instructions = `👋 *Welcome to the STL Print Queue\!*

You can upload a \`.stl\` or \`.STL\` file here and include a caption with print settings. Example:

\`\`\`
printer: Artillery Sidewinder X2
material: PLA
infill: 20%
infill_type: Gyroid
perimeters: 3
supports: yes
description: Sample gear part
\`\`\`

*Available printers:* ${PRINTERS.join(',\n')}

I'll automatically upload it to the server and queue it for printing 🧠

✅ Send /queue to view the current print queue.

ℹ️ If you forget any fields, defaults will be used.`;

  bot.sendMessage(chatId, escapeMarkdownV2(instructions), { parse_mode: 'MarkdownV2' });
});

bot.onText(/\/queue/, (msg) => {
  const chatId = msg.chat.id;

  getJobs((err, jobs) => {
    if (err) {
      console.error('❌ Failed to fetch jobs from database:', err.message);
      return bot.sendMessage(chatId, '❌ Failed to fetch jobs from the database.');
    }

    if (!jobs.length) {
      return bot.sendMessage(chatId, '✅ Queue is empty.');
    }

    const text = jobs.map(j =>
      `• ${escapeMarkdownV2(j.filename)} \\(_${escapeMarkdownV2(j.status || JOB_STATUS_QUEUED)}_\\)`
    ).join('\n');

    bot.sendMessage(chatId, `🧾 *Queue:*\n${text}`, { parse_mode: 'MarkdownV2' });
  });
});

bot.on('document', async (msg) => {
  try {
    const file = msg.document;
    const chatId = msg.chat.id.toString();

    if (!file?.file_name?.toLowerCase().endsWith('.stl')) {
      return bot.sendMessage(chatId, '⚠️ Please send a `.stl` file.');
    }

    const meta = parseCaption(msg.caption || '');

    const printer = meta.printer || DEFAULTS.printer;
    const material = meta.material || DEFAULTS.material;
    const infill = meta.infill || DEFAULTS.infill;
    const infill_type = meta.infill_type || DEFAULTS.infill_type;
    const supports = (meta.supports || '').toLowerCase() === 'yes';
    const perimeters = parseInt(meta.perimeters);
    const validPerimeters = Number.isInteger(perimeters) && perimeters > 0 ? perimeters : DEFAULTS.perimeters;
    const description = meta.description || DEFAULTS.description;

    const id = uuidv4();
    const originalName = normalizeUploadFilename(file.file_name);
    const filename = originalName;

    ensureDirs();

    let buffer;
    try {
      buffer = await downloadTelegramFile(file.file_id);
    } catch (err) {
      console.error('❌ Failed to fetch file from Telegram:', err.message);
      return bot.sendMessage(chatId, '❌ Failed to download the file from Telegram.');
    }

    // Avoid overwriting if user uploads same filename twice.
    const storedFilename = `${id}-${filename}`;
    const storagePath = path.join(STORAGE_DIR, storedFilename);
    fs.writeFileSync(storagePath, Buffer.from(buffer));

    const job = {
      id,
      filename,
      original_name: originalName,
      file_size_mb: (file.file_size / 1_000_000).toFixed(1),
      printer,
      material,
      infill,
      infill_type,
      supports,
      perimeters: validPerimeters,
      description,
      status: JOB_STATUS_QUEUED,
      created_at: new Date().toISOString()
    };

    fs.writeFileSync(path.join(METADATA_DIR, `${id}.json`), JSON.stringify(job, null, 2));

    // Save to database
    addJob(job, (err) => {
      if (err) {
        console.error('❌ Failed to add job to database:', err.message);
        return bot.sendMessage(chatId, '❌ Failed to add job to database.');
      }
      bot.sendMessage(chatId, `✅ Uploaded *${filename}* and added to queue.`, { parse_mode: 'Markdown' });
    });
  } catch (err) {
    console.error('❌ Telegram document handler failed:', err);
  }
});

function notifyUpload(job) {
  const message = `📤 *New STL Uploaded*\n🖨 Printer: ${job.printer}\n🧱 Material: ${job.material}\n📁 File: ${job.filename}`;
  bot.sendMessage(job.chat_id, message, { parse_mode: 'Markdown' });
}

module.exports = { notifyUpload };
