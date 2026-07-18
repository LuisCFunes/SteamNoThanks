# SteamNoThanks

Compare Steam game prices across authorized stores and grey market key shops in one place.

Search for any game, click a result, and see a side-by-side comparison of prices from official storefronts (via IsThereAnyDeal) and grey market key sellers (scraped from AllKeyShop) including G2A, Kinguin, Eneba, GAMIVO, and K4G.

## Features

- **Two-step flow** — search games, then click a card to see prices
- **Authorized store prices** — via IsThereAnyDeal API (Steam, Humble, Fanatical, etc.)
- **Grey market scraping** — G2A, Kinguin, Eneba, GAMIVO, K4G prices aggregated from AllKeyShop
- **EUR to USD conversion** — daily exchange rate via Frankfurter API (free, no key required)
- **Dark gaming theme** — clean, responsive web UI
- **Steam exclusivity indicator** — shows "Steam Exclusive" when no other authorized stores carry the game

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express |
| Frontend | Vanilla HTML, CSS, JavaScript |
| Authorized store data | [IsThereAnyDeal API](https://isthereanydeal.com/) (v3) |
| Grey market data | [AllKeyShop](https://www.allkeyshop.com/) via Playwright (headless Chromium) |
| Exchange rates | [Frankfurter API](https://www.frankfurter.app/) |

## Prerequisites

- Node.js 18+
- An IsThereAnyDeal API key ([get one here](https://isthereanydeal.com/apps/))

## Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/SteamNoThanks.git
cd SteamNoThanks

# Install dependencies
npm install

# Create .env with your ITAD API key
echo "ITAD_API_KEY=your_key_here" > .env

# Start the server
npm start
```

Open `http://localhost:3000` in your browser.

## Usage

1. Type a game title in the search bar and press Enter
2. Browse the game results grid and click on a game card
3. View authorized store prices in the table (sorted by price)
4. Scroll to the grey market section for key prices from G2A, Kinguin, Eneba, GAMIVO, and K4G
5. Click "Buy" to go directly to the store page

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/search?title=<query>` | Search games via ITAD |
| `GET /api/prices?id=<id>&country=US` | Get prices for a game via ITAD |
| `GET /api/info?id=<id>` | Get game info via ITAD |
| `GET /api/scrape-allkeyshop?title=<title>` | Scrape grey market offers from AllKeyShop |
| `GET /api/exchange-rate` | Get current EUR to USD exchange rate |

## Project Structure

```
SteamNoThanks/
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js
│   └── index.html
├── routes/
│   └── api.js
├── scrapers/
│   └── allkeyshop.js
├── server.js
├── package.json
└── .env
```

## Disclaimer

Grey market keys are sold by third-party resellers. Prices and availability change frequently. AllKeyShop scraping relies on the page structure and may break if the site updates. This project is for educational purposes.

## License

MIT
