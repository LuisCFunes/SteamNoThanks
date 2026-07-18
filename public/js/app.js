const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMsg = document.getElementById('errorMsg');
const results = document.getElementById('results');
const gameList = document.getElementById('gameList');
const gameListGrid = document.getElementById('gameListGrid');
const backBtn = document.getElementById('backBtn');
const gameTitle = document.getElementById('gameTitle');
const gameImage = document.getElementById('gameImage');
const gameDetails = document.getElementById('gameDetails');
const priceTableBody = document.getElementById('priceTableBody');
const steamPrice = document.getElementById('steamPrice');
const steamPriceAmount = document.getElementById('steamPriceAmount');
const steamPriceRegular = document.getElementById('steamPriceRegular');
const steamLowest = document.getElementById('steamLowest');
const greyTableBody = document.getElementById('greyTableBody');
const greyMessage = document.getElementById('greyMessage');
const greySection = document.getElementById('greySection');
const loadingText = document.getElementById('loadingText');

let EUR_TO_USD = 1.09;

fetch('/api/exchange-rate').then(r => r.json()).then(d => { EUR_TO_USD = d.EUR_TO_USD; }).catch(() => {});

let lastSearchResults = [];

function formatPrice(amount, currency) {
  if (amount === null || amount === undefined) return 'N/A';
  const symbols = { USD: '$', EUR: '\u20AC', MXN: 'MX$', ARS: 'AR$', COP: 'COP$', CLP: 'CLP$' };
  return `${symbols[currency] || '$'}${Number(amount).toFixed(2)}`;
}

function hideAll() {
  loading.classList.add('hidden');
  error.classList.add('hidden');
  results.classList.add('hidden');
  gameList.classList.add('hidden');
}

function showLoading(text) {
  hideAll();
  loadingText.textContent = text || 'Searching...';
  loading.classList.remove('hidden');
}

function showError(msg) {
  hideAll();
  error.classList.remove('hidden');
  errorMsg.textContent = msg;
}

// --- Search: show game list ---
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  showLoading('Searching games...');

  try {
    const searchRes = await fetch(`/api/search?title=${encodeURIComponent(query)}`);
    const searchData = await searchRes.json();
    const games = Array.isArray(searchData) ? searchData : (searchData.data || searchData.value || []);

    if (!games || games.length === 0) {
      showError('No results found for "' + query + '"');
      return;
    }

    lastSearchResults = games;
    localStorage.setItem('lastQuery', query);
    hideAll();
    renderGameList(games);
  } catch (e) {
    showError('Error searching for game. Try again.');
    console.error(e);
  }
});

// --- Game list ---
function renderGameList(games) {
  gameListGrid.innerHTML = '';

  games.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.addEventListener('click', () => selectGame(game));

    const img = game.assets ? (game.assets.boxart || game.assets.banner300) : '';

    card.innerHTML = img
      ? `<img src="${img}" alt="${game.title}" loading="lazy" width="220" height="124">`
      : `<div class="game-card-noimg">🎮</div>`;
    card.innerHTML += `<div class="game-card-title">${game.title}</div>`;

    gameListGrid.appendChild(card);
  });

  gameList.classList.remove('hidden');
}

// --- Select a game: fetch prices ---
async function selectGame(game) {
  showLoading('Fetching prices...');

  try {

    const [pricesRes, infoRes, aksRes] = await Promise.all([
      fetch(`/api/prices?id=${game.id}&country=US`),
      fetch(`/api/info?id=${game.id}`),
      fetch(`/api/scrape-allkeyshop?title=${encodeURIComponent(game.title)}`),
    ]);

    const pricesData = await pricesRes.json();
    const infoData = await infoRes.json();
    let aksError = false;
    const aksData = await aksRes.json().catch(() => { aksError = true; return []; });
    const priceInfo = Array.isArray(pricesData) && pricesData.length > 0 ? pricesData[0] : null;

    hideAll();
    renderGame(game, infoData, priceInfo, aksData, aksError);
    results.classList.remove('hidden');
  } catch (e) {
    showError('Error fetching prices. Try again.');
    console.error(e);
  }
}

// --- Back button ---
backBtn.addEventListener('click', () => {
  hideAll();
  renderGameList(lastSearchResults);
});

// --- Render price comparison ---
function renderGame(game, info, priceInfo, aksOffers, aksError) {
  gameTitle.textContent = game.title;

  const img = game.assets ? game.assets.boxart || game.assets.banner300 : '';
  gameImage.src = img || '';
  gameImage.alt = game.title;
  gameImage.style.display = img ? 'block' : 'none';

  const tags = info.tags ? info.tags.slice(0, 5).join(', ') : '';
  const developers = info.developers ? info.developers.map(d => d.name).join(', ') : '';

  gameDetails.innerHTML = `
    ${developers ? `<p><strong>Desarrollador:</strong> ${developers}</p>` : ''}
    ${tags ? `<p><strong>Tags:</strong> ${tags}</p>` : ''}
    ${info.appid ? `<p><a href="https://store.steampowered.com/app/${info.appid}" target="_blank" style="color:#e94560;">Ver en Steam &#8599;</a></p>` : ''}
  `;

  priceTableBody.innerHTML = '';
  steamPrice.classList.add('hidden');

  if (!priceInfo || !priceInfo.deals || priceInfo.deals.length === 0) {
    priceTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">No prices available for this game</td></tr>';
    return;
  }

  const steamDeal = priceInfo.deals.find(d => d.shop && d.shop.name === 'Steam');
  const steamAmount = steamDeal ? steamDeal.price.amount : null;
  const historyLow = priceInfo.historyLow;

  if (steamDeal) {
    steamPrice.classList.remove('hidden');
    steamPriceAmount.textContent = formatPrice(steamDeal.price.amount, steamDeal.price.currency);

    if (steamDeal.cut > 0) {
      steamPriceRegular.textContent = `Normal: ${formatPrice(steamDeal.regular.amount, steamDeal.regular.currency)} (-${steamDeal.cut}% de descuento)`;
      steamPriceRegular.style.display = '';
    } else {
      steamPriceRegular.style.display = 'none';
    }

    if (historyLow && historyLow.all) {
      steamLowest.textContent = `Historico mas bajo: ${formatPrice(historyLow.all.amount, historyLow.all.currency)}`;
      steamLowest.style.display = '';
    } else {
      steamLowest.style.display = 'none';
    }
  }

  const sortedDeals = [...priceInfo.deals]
    .filter(d => d.shop && d.shop.name !== 'Steam')
    .sort((a, b) => (a.price.amount || Infinity) - (b.price.amount || Infinity));

  sortedDeals.forEach(deal => {
    const shop = deal.shop || { name: 'Tienda desconocida' };
    const tr = document.createElement('tr');
    const price = deal.price.amount;
    const cut = deal.cut || 0;

    let diffHtml = '-';
    if (steamAmount && price !== null) {
      const diff = steamAmount - price;
      if (diff > 0) {
        diffHtml = `<span class="diff-cheaper">-$${diff.toFixed(2)}</span>`;
      } else if (diff < 0) {
        diffHtml = `<span class="diff-expensive">+$${Math.abs(diff).toFixed(2)}</span>`;
      } else {
        diffHtml = '<span class="diff-same">Igual</span>';
      }
    }

    tr.innerHTML = `
      <td>${shop.name}</td>
      <td class="price">${formatPrice(price, deal.price.currency)}</td>
      <td class="diff">${diffHtml}</td>
      <td class="discount">${cut > 0 ? `-${cut}%` : '-'}</td>
      <td><a href="${deal.url || '#'}" target="_blank">Buy</a></td>
    `;
    priceTableBody.appendChild(tr);
  });

  if (sortedDeals.length === 0 && steamDeal) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="5" style="text-align:center;color:#888;">Steam Exclusive</td>';
    priceTableBody.appendChild(tr);
  }

  greyMessage.classList.add('hidden');
  greyTableBody.innerHTML = '';

  if (aksError) {
    greyMessage.textContent = 'Error querying grey market stores. Try again.';
    greyMessage.className = 'grey-message error';
    greySection.classList.remove('hidden');
  } else if (!aksOffers || aksOffers.length === 0) {
    greyMessage.textContent = 'No grey market offers found for this game.';
    greyMessage.className = 'grey-message info';
    greySection.classList.remove('hidden');
  } else {
    const steamEquiv = steamAmount ? steamAmount / EUR_TO_USD : null;
    const sortedAKS = [...aksOffers]
      .filter(o => o.platform === 'Steam')
      .sort((a, b) => a.priceEUR - b.priceEUR);

    if (sortedAKS.length === 0) {
      greyMessage.textContent = 'No Steam keys found on grey market.';
      greyMessage.className = 'grey-message info';
      greySection.classList.remove('hidden');
    } else {
      sortedAKS.forEach(offer => {
        const tr = document.createElement('tr');
        const priceUSD = offer.priceEUR * EUR_TO_USD;

        let diffHtml = '-';
        if (steamEquiv) {
          const diff = steamEquiv - offer.priceEUR;
          if (diff > 0) {
            diffHtml = `<span class="diff-cheaper">-$${diff.toFixed(2)}</span>`;
          } else if (diff < 0) {
            diffHtml = `<span class="diff-expensive">+$${Math.abs(diff).toFixed(2)}</span>`;
          } else {
            diffHtml = '<span class="diff-same">Igual</span>';
          }
        }

        tr.innerHTML = `
          <td>${offer.shop} <span class="grey-badge">KEY</span></td>
          <td class="price">\u20AC${offer.priceEUR.toFixed(2)} <span class="price-usd">($${priceUSD.toFixed(2)})</span></td>
          <td class="diff">${diffHtml}</td>
          <td><a href="${offer.url}" target="_blank">Buy</a></td>
        `;
        greyTableBody.appendChild(tr);
      });

      greySection.classList.remove('hidden');
    }
  }
}

// --- Restore search input on page load ---
(function restoreState() {
  const savedQuery = localStorage.getItem('lastQuery');
  if (savedQuery) {
    searchInput.value = savedQuery;
  }
})();
