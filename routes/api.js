const express = require('express');
const axios = require('axios');
const router = express.Router();

const ITAD_BASE = 'https://api.isthereanydeal.com';
const API_KEY = process.env.ITAD_API_KEY;

router.get('/search', async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const response = await axios.get(`${ITAD_BASE}/games/search/v1`, {
      params: { title, key: API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Error searching games' });
  }
});

router.get('/prices', async (req, res) => {
  try {
    const { id, country } = req.query;
    if (!id) return res.status(400).json({ error: 'Game ID is required' });

    const response = await axios.post(
      `${ITAD_BASE}/games/prices/v3?key=${API_KEY}&country=${country || 'US'}`,
      [id],
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Prices error:', error.message);
    res.status(500).json({ error: 'Error fetching prices' });
  }
});

router.get('/info', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Game ID is required' });

    const response = await axios.get(`${ITAD_BASE}/games/info/v2`, {
      params: { id, key: API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Info error:', error.message);
    res.status(500).json({ error: 'Error fetching game info' });
  }
});

// --- Scraping routes for grey market stores ---

router.get('/scrape-allkeyshop', async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const { scrapeAllKeyShop } = require('../scrapers/allkeyshop');
    const offers = await scrapeAllKeyShop(title);
    res.json(offers);
  } catch (error) {
    console.error('AllKeyShop scrape error:', error.message);
    res.status(500).json({ error: 'Error scraping AllKeyShop', details: error.message, stack: error.stack?.split('\n').slice(0,5).join('\n') });
  }
});

module.exports = router;
