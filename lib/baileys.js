/**
 * TO•XI•C_B•O•T v4.0.0 — Baileys Connection Manager
 * Vercel-compatible (serverless) pairing module
 *
 * CRITICAL: requestPairingCode() must be called AFTER the 'qr' event
 * On device link: sends TWO WhatsApp messages:
 *   Message 1: Raw Session ID
 *   Message 2: "✅ BOT CONNECTED! 🚀 DEPLOY YOBBY BOT NOW!"
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  BufferJSON,
  Browsers,
} = require('mrxd-baileys');

const P = require('pino');
const fs = require('fs');
const path = require('path');
const os = require('os');

const logger = P({ level: 'silent' });

// In-memory connection storage
const activeConnections = new Map();

// Generate cool session code
function generateCoolCode() {
  const PREFIXES = ['TOX', 'TXC', 'KNG', 'BOT', 'ZAP', 'FLX', 'VPR', 'RDX', 'NVA', 'PKD', 'SNK', 'DRG', 'PHX', 'MTX', 'LVN', 'CRX'];
  const SUFFIXES = ['KING', 'QUEEN', 'BOSS', 'GOD', 'ACE', 'PRO', 'MAX', 'LORD', 'TITAN', 'DEMON', 'GHOST', 'HAWK', 'WOLF', 'FURY', 'BLITZ', 'STORM', 'FLAME', 'FROST', 'VENOM', 'BLAZE', 'NEXUS'];
  const MIDS = ['C', 'X', 'Z', 'V', 'N', 'K', 'R', 'T', 'S', 'M'];
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const mid = MIDS[Math.floor(Math.random() * MIDS.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return `${prefix}${mid}${suffix}`;
}

// Format pairing code
function formatPairingCode(code) {
  if (!code) return '';
  if (code.length === 8) return `${code.slice(0, 4)}-${code.slice(4)}`;
  return code;
}

// Serialize auth state to base64
function serializeAuthState(state) {
  try {
    const jsonStr = JSON.stringify(state, BufferJSON.replacer);
    const base64 = Buffer.from(jsonStr).toString('base64');
    return `TO•XI•C_B•O•T:~${base64}`;
  } catch (e) {
    console.error('Serialize error:', e);
    return '';
  }
}

// Send Session ID to WhatsApp — two messages
async function sendSessionToWhatsApp(socket, phoneNumber, authStateBase64) {
  const jid = phoneNumber + '@s.whatsapp.net';
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  const sessionOnly = authStateBase64;
  const connectedMsg = '✅ BOT CONNECTED!\n\n🚀 DEPLOY YOBBY BOT NOW!\n\nCopy the Session ID above and use it to deploy your bot.';

  try {
    await socket.sendMessage(jid, { text: sessionOnly });
    console.log(`[PAIR] Session ID sent to WhatsApp ${jid}`);
    await delay(1500);
    await socket.sendMessage(jid, { text: connectedMsg });
    console.log(`[PAIR] Connected message sent to WhatsApp ${jid}`);
  } catch (sendErr) {
    console.error('[PAIR] Send failed:', sendErr?.message);
    try {
      await delay(3000);
      await socket.sendMessage(jid, { text: sessionOnly });
      await delay(1500);
      await socket.sendMessage(jid, { text: connectedMsg });
      console.log(`[PAIR] Session ID sent (retry) to WhatsApp ${jid}`);
    } catch (retryErr) {
      console.error('[PAIR] Retry failed:', retryErr?.message);
    }
  }
}

// Start pairing session
async function startPairingSession(phoneNumber) {
  try {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const sessionId = generateCoolCode();

    activeConnections.set(sessionId, {
      status: 'connecting',
      sessionId,
      phoneNumber: cleanPhone,
      pairingCode: null,
      authState: null,
      createdAt: new Date().toISOString(),
    });

    // Start Baileys in background (non-blocking)
    setImmediate(() => {
      startBaileysInBackground(sessionId, cleanPhone).catch(e => {
        console.error('Baileys bg error:', e?.message);
      });
    });

    return { success: true, sessionId };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to start pairing session' };
  }
}

// Background Baileys connection
async function startBaileysInBackground(sessionId, phoneNumber) {
  try {
    const sessionDir = path.join(os.tmpdir(), `toxic_${sessionId}_${Date.now()}`);
    fs.mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const socket = makeWASocket({
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
      printQRInTerminal: false,
      logger,
      browser: Browsers.ubuntu('Chrome'),
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
      qrTimeout: 60_000,
    });

    const conn = activeConnections.get(sessionId);
    if (conn) { conn.socket = socket; conn.baileysDir = sessionDir; conn.state = state; }

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update) => {
      try {
        const { connection, lastDisconnect, qr } = update;

        // CRITICAL: Wait for QR before requesting pairing code
        if (qr) {
          console.log(`[PAIR] QR received for ${sessionId}, requesting pairing code...`);
          try {
            const rawCode = await socket.requestPairingCode(phoneNumber);
            const code = formatPairingCode(rawCode);
            console.log(`[PAIR] Code: ${code} for ${sessionId}`);
            const c = activeConnections.get(sessionId);
            if (c) { c.pairingCode = code; c.status = 'pairing'; }
          } catch (pairError) {
            console.error('[PAIR] Code request failed:', pairError?.message);
            const c = activeConnections.get(sessionId);
            if (c) c.status = 'error';
          }
        }

        if (connection === 'open') {
          console.log(`[PAIR] Device linked for ${sessionId}!`);
          const c = activeConnections.get(sessionId);
          if (c) c.status = 'connected';

          const authStateBase64 = serializeAuthState(state);
          if (c) c.authState = authStateBase64;

          // Send Session ID to WhatsApp
          await sendSessionToWhatsApp(socket, phoneNumber, authStateBase64);

          // Close socket after sending
          setTimeout(() => { try { socket.end(undefined); } catch {} }, 5000);
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const c = activeConnections.get(sessionId);
          if (c && c.status !== 'connected') {
            if (statusCode === 515 || statusCode === 428) {
              console.log(`[PAIR] Restart required for ${sessionId}...`);
            }
            c.status = 'disconnected';
          }
        }
      } catch {}
    });

    console.log(`[PAIR] Socket created for ${sessionId}, waiting for QR event...`);
  } catch (error) {
    console.error('[PAIR] Error:', error?.message);
    const conn = activeConnections.get(sessionId);
    if (conn) conn.status = 'error';
  }
}

// Check pairing status
async function checkPairingStatus(sessionId) {
  const conn = activeConnections.get(sessionId);

  if (conn) {
    if (conn.status === 'connected' && conn.authState) {
      return { success: true, status: 'connected', authState: conn.authState, pairingCode: conn.pairingCode };
    }
    return { success: true, status: conn.status, pairingCode: conn.pairingCode };
  }

  return { success: false, status: 'not_found', error: 'Session not found' };
}

// Process error handlers (prevent Baileys crashes)
if (typeof process !== 'undefined') {
  process.on('uncaughtException', (error) => {
    console.error('[TOXIC-BOT] Uncaught exception:', error?.message);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[TOXIC-BOT] Unhandled rejection:', String(reason));
  });
}

module.exports = { startPairingSession, checkPairingStatus };
