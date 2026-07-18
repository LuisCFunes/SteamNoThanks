require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

let eurToUsd = 1.09;

async function updateExchangeRate() {
  try {
    const res = await axios.get('https://api.frankfurter.app/latest?from=EUR&to=USD', { timeout: 5000 });
    if (res.data && res.data.rates && res.data.rates.USD) {
      eurToUsd = res.data.rates.USD;
      console.log(`EUR/USD rate updated: ${eurToUsd}`);
    }
  } catch (err) {
    console.error('Failed to fetch EUR/USD rate, using fallback:', err.message);
  }
}

updateExchangeRate();
setInterval(updateExchangeRate, 24 * 60 * 60 * 1000);

app.get('/api/exchange-rate', (req, res) => {
  res.json({ EUR_TO_USD: eurToUsd });
});

app.get('/api/diagnostics', async (req, res) => {
  const result = { playwrite: false, chromium: false, systemChromium: null, pathsChecked: [], error: null };
  try {
    const { chromium } = require('playwright');
    const { execSync } = require('child_process');
    const { accessSync, constants } = require('fs');
    result.playwrite = true;
    const paths = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'];
    for (const p of paths) {
      try {
        accessSync(p, constants.X_OK);
        result.systemChromium = p;
        result.pathsChecked.push({ path: p, found: true });
      } catch {
        result.pathsChecked.push({ path: p, found: false });
      }
    }
    try {
      const which = execSync('which chromium 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
      if (which && !result.systemChromium) result.systemChromium = which;
    } catch {}
    const config = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    };
    if (result.systemChromium) {
      config.executablePath = result.systemChromium;
    }
    const browser = await chromium.launch(config);
    result.chromium = true;
    const page = await browser.newPage();
    await page.goto('https://httpbin.org/get', { timeout: 15000 });
    result.pageLoad = true;
    const title = await page.title();
    result.title = title;
    await browser.close();
  } catch (e) {
    result.error = e.message;
    result.stack = e.stack?.split('\n').slice(0, 5).join('\n');
  }
  res.json(result);
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
