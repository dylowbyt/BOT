import { Router, type IRouter } from "express";
import QRCode from "qrcode";
import { getState } from "../bot/qr-state.js";

const router: IRouter = Router();

router.get("/qr", async (_req, res) => {
  const state = getState();

  if (state.status === "ready") {
    res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp AI Bot - Status</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #111b21; color: #e9edef; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #202c33; border-radius: 16px; padding: 40px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
    .icon { font-size: 64px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: #00a884; margin-bottom: 8px; }
    .info { color: #8696a0; font-size: 14px; margin-top: 8px; }
    .badge { display: inline-block; background: #00a884; color: #111b21; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Bot Sudah Aktif!</h1>
    <p class="info">Terhubung sebagai:</p>
    <p class="info"><strong>${state.name}</strong> (+${state.phone})</p>
    <div class="badge">● ONLINE</div>
  </div>
</body>
</html>`);
    return;
  }

  if (state.status === "authenticated") {
    res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp AI Bot - Menghubungkan</title>
  <meta http-equiv="refresh" content="3">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #111b21; color: #e9edef; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #202c33; border-radius: 16px; padding: 40px; text-align: center; max-width: 400px; width: 90%; }
    .icon { font-size: 64px; margin-bottom: 16px; animation: spin 2s linear infinite; display: inline-block; }
    @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
    h1 { font-size: 20px; color: #00a884; }
    p { color: #8696a0; margin-top: 12px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚙️</div>
    <h1>Berhasil Login!</h1>
    <p>Menginisialisasi bot... Halaman ini akan refresh otomatis.</p>
  </div>
</body>
</html>`);
    return;
  }

  if (state.status === "disconnected") {
    res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp AI Bot - Terputus</title>
  <meta http-equiv="refresh" content="5">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #111b21; color: #e9edef; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #202c33; border-radius: 16px; padding: 40px; text-align: center; max-width: 400px; width: 90%; }
    .icon { font-size: 64px; margin-bottom: 16px; }
    h1 { font-size: 20px; color: #ef4444; }
    p { color: #8696a0; margin-top: 12px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">❌</div>
    <h1>Bot Terputus</h1>
    <p>WhatsApp terputus. Restart server untuk menghubungkan kembali. Halaman ini akan refresh otomatis.</p>
  </div>
</body>
</html>`);
    return;
  }

  if (!state.qr) {
    res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp AI Bot - Menunggu QR</title>
  <meta http-equiv="refresh" content="3">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #111b21; color: #e9edef; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #202c33; border-radius: 16px; padding: 40px; text-align: center; max-width: 400px; width: 90%; }
    .loader { width: 48px; height: 48px; border: 4px solid #2a3942; border-top: 4px solid #00a884; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
    h1 { font-size: 20px; color: #e9edef; }
    p { color: #8696a0; margin-top: 12px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="loader"></div>
    <h1>Menunggu QR Code...</h1>
    <p>Bot sedang memulai. Halaman ini akan refresh otomatis setiap 3 detik.</p>
  </div>
</body>
</html>`);
    return;
  }

  const qrDataUrl = await QRCode.toDataURL(state.qr, {
    width: 280,
    margin: 2,
    color: { dark: "#111b21", light: "#ffffff" },
  });

  res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scan QR - WhatsApp AI Bot</title>
  <meta http-equiv="refresh" content="30">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #111b21; color: #e9edef; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #202c33; border-radius: 16px; padding: 32px 24px; text-align: center; max-width: 380px; width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
    .logo { font-size: 40px; margin-bottom: 12px; }
    h1 { font-size: 20px; font-weight: 700; color: #e9edef; margin-bottom: 4px; }
    .subtitle { color: #8696a0; font-size: 13px; margin-bottom: 24px; }
    .qr-wrapper { background: #fff; border-radius: 12px; padding: 12px; display: inline-block; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
    .qr-wrapper img { display: block; width: 256px; height: 256px; }
    .steps { text-align: left; background: #2a3942; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
    .step { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; font-size: 13px; color: #e9edef; }
    .step:last-child { margin-bottom: 0; }
    .step-num { background: #00a884; color: #111b21; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
    .timer { color: #8696a0; font-size: 12px; }
    .dot { width: 8px; height: 8px; background: #fbbf24; border-radius: 50%; display: inline-block; animation: blink 1s ease-in-out infinite; margin-right: 6px; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
    .status-bar { display: flex; align-items: center; justify-content: center; color: #fbbf24; font-size: 12px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🤖</div>
    <h1>WhatsApp AI Bot</h1>
    <p class="subtitle">Scan QR Code untuk menghubungkan bot</p>

    <div class="status-bar">
      <span class="dot"></span>
      <span>Menunggu scan...</span>
    </div>

    <div class="qr-wrapper">
      <img src="${qrDataUrl}" alt="QR Code WhatsApp">
    </div>

    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <span>Buka WhatsApp di HP kamu</span>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <span>Tap ⋮ (titik tiga) → <strong>Perangkat Tertaut</strong></span>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <span>Tap <strong>Tautkan Perangkat</strong> lalu scan QR di atas</span>
      </div>
    </div>

    <p class="timer">⏱ QR akan refresh otomatis setiap 30 detik</p>
  </div>
</body>
</html>`);
});

router.get("/qr/image", async (_req, res) => {
  const state = getState();

  if (!state.qr) {
    res.status(404).json({ error: "QR not available", status: state.status });
    return;
  }

  const buffer = await QRCode.toBuffer(state.qr, { width: 300, margin: 2 });
  res.set("Content-Type", "image/png");
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.send(buffer);
});

router.get("/status", (_req, res) => {
  const state = getState();
  res.json({
    status: state.status,
    phone: state.phone,
    name: state.name,
    hasQR: !!state.qr,
  });
});

export default router;
