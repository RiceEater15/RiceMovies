const apiKey = '1070730380f5fee0d87cf0382670b255';
const categories = [
  { name: "🔥 Trending", endpoint: "trending/all/week" },
  { name: "🎬 Popular Movies", endpoint: "movie/popular" },
  { name: "📺 Popular TV Shows", endpoint: "tv/popular" },
  { name: "⭐ Top Rated Movies", endpoint: "movie/top_rated" },
  { name: "🏆 Top Rated TV", endpoint: "tv/top_rated" },
  { name: "🎭 Reality TV", endpoint: "discover/tv?with_genres=10764" },
  { name: "🎥 Documentaries", endpoint: "discover/tv?with_genres=99" },
];

// ── WELCOME ──
window.addEventListener('load', () => {
  const ws = document.getElementById('welcome-screen');
  if (!sessionStorage.getItem('welcomeShown')) {
    sessionStorage.setItem('welcomeShown', 'true');
    setTimeout(() => {
      ws.classList.add('fade-out');
      setTimeout(() => ws.remove(), 800);
    }, 2200);
  } else {
    ws.remove();
  }
});

// ── NAVBAR SCROLL ──
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── SEARCH ──
const searchToggle = document.getElementById('searchToggle');
const searchClose = document.getElementById('searchClose');
const searchInputWrap = document.getElementById('searchInputWrap');
const searchInput = document.getElementById('searchInput');
const searchResultsPane = document.getElementById('searchResultsPane');
const discoverContainer = document.getElementById('discoverContainer');
const heroEl = document.getElementById('hero');

searchToggle.addEventListener('click', () => {
  searchInputWrap.classList.add('open');
  searchInput.focus();
});
searchClose.addEventListener('click', () => {
  searchInputWrap.classList.remove('open');
  searchInput.value = '';
  clearSearch();
});

let searchDebounce;
searchInput.addEventListener('input', e => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => handleSearch(e.target.value.trim()), 300);
});

function clearSearch() {
  searchResultsPane.classList.remove('visible');
  discoverContainer.style.display = '';
  heroEl.style.display = '';
  selectedGenreIds.clear();
  selectedYear = '';
  const yearSelect = document.getElementById('genreYearSelect');
  if (yearSelect) yearSelect.value = '';
  const panel = document.getElementById('genrePanel');
  if (panel) panel.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
  currentView = { mode: null, query: '', type: '', genreIds: [], genreNames: [], year: '', page: 1, totalPages: 1, loading: false };
}

// Tracks whatever is currently shown in #searchResultsPane (a text search or a
// genre/year browse) so infinite scroll knows what to fetch more of, and which page it's on.
let currentView = { mode: null, query: '', type: '', genreIds: [], genreNames: [], year: '', page: 1, totalPages: 1, loading: false };

function checkInfiniteScroll() {
  if (!searchResultsPane.classList.contains('visible')) return;
  if (currentView.loading || currentView.page >= currentView.totalPages) return;

  const winNearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
  const paneNearBottom = searchResultsPane.scrollHeight - searchResultsPane.scrollTop - searchResultsPane.clientHeight <= 500;
  if (!winNearBottom && !paneNearBottom) return;

  currentView.page++;
  if (currentView.mode === 'search') loadSearchPage(false);
  else if (currentView.mode === 'genre') loadGenrePage(false);
  else if (currentView.mode === 'genre-search') loadGenreSearchPage(false);
}
window.addEventListener('scroll', checkInfiniteScroll, { passive: true });
searchResultsPane.addEventListener('scroll', checkInfiniteScroll, { passive: true });

function showLoadMoreIndicator(grid) {
  const el = document.createElement('p');
  el.id = 'loadMoreIndicator';
  el.style.cssText = 'grid-column:1/-1; color:var(--muted); text-align:center; padding:20px;';
  el.textContent = 'Loading more...';
  grid.appendChild(el);
  return el;
}

async function handleSearch(query) {
  if (!query) { clearSearch(); return; }
  discoverContainer.style.display = 'none';
  heroEl.style.display = 'none';
  searchResultsPane.classList.add('visible');

  currentView = { mode: 'search', query, type: '', genreIds: [], genreNames: [], year: '', page: 1, totalPages: 1, loading: false };

  const grid = document.getElementById('searchGrid');
  grid.innerHTML = '';
  await loadSearchPage(true);
}

async function loadSearchPage(isFirst) {
  if (currentView.loading) return;
  currentView.loading = true;
  const grid = document.getElementById('searchGrid');
  const loadingEl = isFirst ? null : showLoadMoreIndicator(grid);

  const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(currentView.query)}&language=en-US&page=${currentView.page}`);
  const data = await res.json();
  currentView.totalPages = data.total_pages || 1;

  if (loadingEl) loadingEl.remove();

  const items = (data.results || []).filter(r => r.media_type !== 'person' && r.poster_path);
  if (isFirst && !items.length) {
    grid.innerHTML = `<p style="color:var(--muted); grid-column:1/-1">No results for "${currentView.query}"</p>`;
  } else {
    items.forEach(item => { const c = createCard(item); if (c) grid.appendChild(c); });
  }
  currentView.loading = false;
}

// ── GENRES + YEAR FILTER ──
let movieGenres = [], tvGenres = [];
let selectedGenreIds = new Set(); // multi-select, ids for whichever type tab is active
let panelType = 'movie';          // 'movie' | 'tv'
let selectedYear = '';            // '' = any year

async function loadGenres() {
  try {
    const [mRes, tRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=en-US`).then(r => r.json()),
      fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${apiKey}&language=en-US`).then(r => r.json())
    ]);
    movieGenres = mRes.genres || [];
    tvGenres = tRes.genres || [];
    buildGenreUI();
  } catch (err) {
    console.error('Failed to load genres', err);
  }
}

function buildGenreUI() {
  // Inject styles once (self-contained so no CSS file edits are required)
  if (!document.getElementById('genre-filter-styles')) {
    const style = document.createElement('style');
    style.id = 'genre-filter-styles';
    style.textContent = `
      .genre-panel { position:fixed; top:64px; right:20px; background:#141414; border:1px solid #333;
        border-radius:10px; padding:16px; width:300px; max-height:80vh; overflow-y:auto; z-index:999;
        display:none; box-shadow:0 10px 30px rgba(0,0,0,.6); }
      .genre-panel.open { display:block; }
      .genre-type-tabs { display:flex; gap:6px; margin-bottom:10px; }
      .genre-type-tab { flex:1; background:#0d0d0d; border:1px solid #333; border-radius:6px; color:#aaa;
        padding:7px 0; font-size:.8rem; cursor:pointer; transition:background .2s,color .2s,border-color .2s; }
      .genre-type-tab.active { background:#e50914; border-color:#e50914; color:#fff; }
      .genre-filter-input { width:100%; box-sizing:border-box; background:#0d0d0d; border:1px solid #333;
        border-radius:6px; color:#fff; padding:8px 10px; font-size:.85rem; margin-bottom:10px; outline:none; }
      .genre-filter-input:focus { border-color:#e50914; }
      .genre-chip-list { display:flex; flex-wrap:wrap; gap:8px; }
      .genre-chip { background:#232323; color:#eee; border:1px solid #333; border-radius:20px;
        padding:6px 14px; font-size:.85rem; cursor:pointer; transition:background .2s,border-color .2s; }
      .genre-chip:hover, .genre-chip.active { background:#e50914; border-color:#e50914; color:#fff; }
      .genre-year-row { margin-top:14px; }
      .genre-year-row label { display:block; color:#aaa; font-size:.75rem; text-transform:uppercase;
        letter-spacing:.05em; margin-bottom:6px; }
      .genre-year-row select { width:100%; box-sizing:border-box; background:#0d0d0d; border:1px solid #333;
        border-radius:6px; color:#fff; padding:8px 10px; font-size:.85rem; outline:none; }
      .genre-clear-btn { width:100%; margin-top:14px; background:none; border:1px solid #333; border-radius:6px;
        color:#aaa; padding:8px 0; font-size:.8rem; cursor:pointer; transition:border-color .2s,color .2s; }
      .genre-clear-btn:hover { border-color:#e50914; color:#fff; }
    `;
    document.head.appendChild(style);
  }

  // Toggle button — reuses the existing .search-toggle class so it matches
  // the search icon's look, docked into .navbar-right before the search wrapper
  let toggleBtn = document.getElementById('genreToggle');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'genreToggle';
    toggleBtn.className = 'search-toggle';
    toggleBtn.setAttribute('aria-label', 'Browse by genre');
    toggleBtn.title = 'Browse by genre';
    toggleBtn.innerHTML = '<i class="bi bi-collection-play"></i>';
    const navbarRight = document.querySelector('.navbar-right');
    const searchWrapper = document.querySelector('.search-wrapper');
    navbarRight.insertBefore(toggleBtn, searchWrapper);
  }

  // Dropdown panel: type tabs, genre-name filter, multi-select chips, year select, clear button
  let panel = document.getElementById('genrePanel');
  const isNewPanel = !panel;
  if (isNewPanel) {
    panel = document.createElement('div');
    panel.id = 'genrePanel';
    panel.className = 'genre-panel';
    document.body.appendChild(panel);
  }

  const thisYear = new Date().getFullYear();
  let yearOptions = '<option value="">Any year</option>';
  for (let y = thisYear + 1; y >= 1950; y--) yearOptions += `<option value="${y}">${y}</option>`;

  panel.innerHTML = `
    <div class="genre-type-tabs">
      <button class="genre-type-tab" data-type="movie">Movies</button>
      <button class="genre-type-tab" data-type="tv">TV Shows</button>
    </div>
    <input type="text" id="genreFilterInput" class="genre-filter-input" placeholder="Search genres..." autocomplete="off" />
    <div class="genre-chip-list" id="genreChipList"></div>
    <div class="genre-year-row">
      <label for="genreYearSelect">Release year</label>
      <select id="genreYearSelect">${yearOptions}</select>
    </div>
    <button id="genreClearBtn" class="genre-clear-btn">Clear filters</button>
  `;

  panel.querySelectorAll('.genre-type-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.type === panelType);
    tab.onclick = e => {
      e.stopPropagation();
      if (panelType === tab.dataset.type) return;
      panelType = tab.dataset.type;
      selectedGenreIds.clear(); // movie/tv genre ids don't correspond to the same genres
      panel.querySelectorAll('.genre-type-tab').forEach(t => t.classList.toggle('active', t.dataset.type === panelType));
      renderChipList();
      scheduleGenreBrowse();
    };
  });

  const filterInput = panel.querySelector('#genreFilterInput');
  filterInput.addEventListener('click', e => e.stopPropagation());
  filterInput.addEventListener('input', applyGenreTextFilter);

  const yearSelect = panel.querySelector('#genreYearSelect');
  yearSelect.value = selectedYear;
  yearSelect.addEventListener('click', e => e.stopPropagation());
  yearSelect.addEventListener('change', e => {
    selectedYear = e.target.value;
    scheduleGenreBrowse();
  });

  panel.querySelector('#genreClearBtn').onclick = e => {
    e.stopPropagation();
    selectedGenreIds.clear();
    selectedYear = '';
    yearSelect.value = '';
    filterInput.value = '';
    renderChipList();
    clearSearch();
  };

  toggleBtn.onclick = e => {
    e.stopPropagation();
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) setTimeout(() => filterInput.focus(), 50);
  };

  if (isNewPanel) {
    document.addEventListener('click', e => {
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== toggleBtn) {
        panel.classList.remove('open');
      }
    });
  }

  renderChipList();
}

function renderChipList() {
  const chipList = document.getElementById('genreChipList');
  if (!chipList) return;
  const genres = panelType === 'movie' ? movieGenres : tvGenres;
  chipList.innerHTML = genres.map(g =>
    `<div class="genre-chip${selectedGenreIds.has(g.id) ? ' active' : ''}" data-id="${g.id}">${g.name}</div>`
  ).join('');
  chipList.querySelectorAll('.genre-chip').forEach(chip => {
    chip.onclick = e => {
      e.stopPropagation();
      const id = Number(chip.dataset.id);
      if (selectedGenreIds.has(id)) selectedGenreIds.delete(id); else selectedGenreIds.add(id);
      chip.classList.toggle('active');
      scheduleGenreBrowse();
    };
  });
  applyGenreTextFilter();
}

function applyGenreTextFilter() {
  const filterInput = document.getElementById('genreFilterInput');
  if (!filterInput) return;
  const q = filterInput.value.trim().toLowerCase();
  document.querySelectorAll('#genreChipList .genre-chip').forEach(chip => {
    chip.style.display = chip.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

// Debounced so rapid clicking across several chips/year doesn't fire a fetch per click
let genreBrowseDebounce;
function scheduleGenreBrowse() {
  clearTimeout(genreBrowseDebounce);
  genreBrowseDebounce = setTimeout(() => {
    if (selectedGenreIds.size === 0 && !selectedYear) { clearSearch(); return; }
    const genres = panelType === 'movie' ? movieGenres : tvGenres;
    const genreNames = genres.filter(g => selectedGenreIds.has(g.id)).map(g => g.name);
    browseByGenres(panelType, [...selectedGenreIds], genreNames, selectedYear);
  }, 250);
}

async function browseByGenres(type, genreIds, genreNames, year) {
  discoverContainer.style.display = 'none';
  heroEl.style.display = 'none';
  searchInputWrap.classList.remove('open');
  searchInput.value = '';
  searchResultsPane.classList.add('visible');

  currentView = { mode: 'genre', query: '', type, genreIds, genreNames, year, page: 1, totalPages: 1, loading: false };

  const grid = document.getElementById('searchGrid');
  grid.innerHTML = '';

  const heading = document.createElement('h2');
  heading.style.cssText = 'grid-column:1/-1; color:#fff; font-size:1.4rem; margin:0 0 4px; font-weight:600;';
  const typeLabel = type === 'tv' ? 'TV Shows' : 'Movies';
  const genrePart = genreNames.length ? genreNames.join(', ') : 'All';
  const yearPart = year ? ` (${year})` : '';
  heading.textContent = `${genrePart} ${typeLabel}${yearPart}`;
  grid.appendChild(heading);

  const searchWrap = document.createElement('div');
  searchWrap.style.cssText = 'grid-column:1/-1; margin-bottom:6px;';
  searchWrap.innerHTML = `<input type="text" id="genreSearchInput" placeholder="Search within these results..." autocomplete="off"
    style="width:100%; box-sizing:border-box; background:#0d0d0d; border:1px solid #333; border-radius:6px;
    color:#fff; padding:10px 12px; font-size:.9rem; outline:none;" />`;
  grid.appendChild(searchWrap);
  const genreSearchInput = searchWrap.querySelector('#genreSearchInput');
  genreSearchInput.addEventListener('focus', () => genreSearchInput.style.borderColor = '#e50914');
  genreSearchInput.addEventListener('blur', () => genreSearchInput.style.borderColor = '#333');

  // Results (cards / "loading more" / "no results") live in here so they can be
  // wiped and re-rendered without disturbing the heading or search box above.
  const container = document.createElement('div');
  container.id = 'genreResultsContainer';
  container.style.display = 'contents';
  grid.appendChild(container);

  let genreSearchDebounce;
  genreSearchInput.addEventListener('input', () => {
    clearTimeout(genreSearchDebounce);
    genreSearchDebounce = setTimeout(() => {
      const q = genreSearchInput.value.trim();
      document.getElementById('genreResultsContainer').innerHTML = '';
      currentView.query = q;
      currentView.page = 1;
      currentView.totalPages = 1;
      if (!q) {
        currentView.mode = 'genre';
        loadGenrePage(true);
      } else {
        currentView.mode = 'genre-search';
        loadGenreSearchPage(true);
      }
    }, 350);
  });

  await loadGenrePage(true);
}

async function loadGenrePage(isFirst) {
  if (currentView.loading) return;
  currentView.loading = true;
  const container = document.getElementById('genreResultsContainer');
  const loadingEl = isFirst ? null : showLoadMoreIndicator(container);

  const { type, genreIds, year, page } = currentView;
  let url = `https://api.themoviedb.org/3/discover/${type}?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&page=${page}`;
  if (genreIds.length) url += `&with_genres=${genreIds.join('|')}`; // pipe = match ANY selected genre
  if (year) url += type === 'tv' ? `&first_air_date_year=${year}` : `&primary_release_year=${year}`;

  const res = await fetch(url);
  const data = await res.json();
  currentView.totalPages = data.total_pages || 1;

  if (loadingEl) loadingEl.remove();

  const items = (data.results || []).filter(r => r.poster_path);
  if (isFirst && !items.length) {
    container.innerHTML += `<p style="color:var(--muted); grid-column:1/-1">No results found.</p>`;
  } else {
    items.forEach(item => {
      item.media_type = type;
      const c = createCard(item);
      if (c) container.appendChild(c);
    });
  }
  currentView.loading = false;
}

async function loadGenreSearchPage(isFirst) {
  if (currentView.loading) return;
  currentView.loading = true;
  const container = document.getElementById('genreResultsContainer');
  const loadingEl = isFirst ? null : showLoadMoreIndicator(container);

  const { type, genreIds, year, query, page } = currentView;
  let url = `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(query)}&page=${page}`;
  if (year) url += type === 'tv' ? `&first_air_date_year=${year}` : `&primary_release_year=${year}`;

  const res = await fetch(url);
  const data = await res.json();
  currentView.totalPages = data.total_pages || 1;

  if (loadingEl) loadingEl.remove();

  // TMDB search doesn't support with_genres, so filter client-side against each result's genre_ids
  const items = (data.results || []).filter(r => {
    if (!r.poster_path) return false;
    if (genreIds.length && (!r.genre_ids || !r.genre_ids.some(id => genreIds.includes(id)))) return false;
    return true;
  });
  if (isFirst && !items.length) {
    container.innerHTML += `<p style="color:var(--muted); grid-column:1/-1">No "${query}" results found.</p>`;
  } else {
    items.forEach(item => {
      item.media_type = type;
      const c = createCard(item);
      if (c) container.appendChild(c);
    });
  }
  currentView.loading = false;
}

// ── HERO ──
let heroItems = [], heroIndex = 0, heroTimer;

async function loadHero() {
  const data = await fetchEndpoint('trending/all/week');
  heroItems = data.filter(d => d.backdrop_path).slice(0, 5);
  buildHeroDots();
  setHero(0);
  heroTimer = setInterval(() => {
    heroIndex = (heroIndex + 1) % heroItems.length;
    setHero(heroIndex);
  }, 7000);
}

function buildHeroDots() {
  const dots = document.getElementById('heroDots');
  dots.innerHTML = '';
  heroItems.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'hero-dot' + (i === 0 ? ' active' : '');
    d.onclick = () => {
      clearInterval(heroTimer);
      heroIndex = i;
      setHero(i);
      heroTimer = setInterval(() => {
        heroIndex = (heroIndex + 1) % heroItems.length;
        setHero(heroIndex);
      }, 7000);
    };
    dots.appendChild(d);
  });
}

function setHero(i) {
  const item = heroItems[i];
  if (!item) return;
  document.getElementById('hero-bg').style.backgroundImage = `url(https://image.tmdb.org/t/p/original${item.backdrop_path})`;
  document.getElementById('hero-title').textContent = item.title || item.name;
  document.getElementById('hero-overview').textContent = item.overview || '';
  document.getElementById('hero-rating').textContent = item.vote_average ? `★ ${item.vote_average.toFixed(1)}` : '';
  document.getElementById('hero-year').textContent = (item.release_date || item.first_air_date || '').slice(0, 4);
  document.getElementById('hero-genre').textContent = item.media_type === 'tv' ? 'TV Series' : 'Movie';

  document.querySelectorAll('.hero-dot').forEach((d, j) => d.classList.toggle('active', j === i));

  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const poster = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
  const dest = buildDest(item, mediaType, poster);

  document.getElementById('hero-play').onclick = () => window.location.href = dest;
  document.getElementById('hero-info').onclick = () => window.location.href = dest;
}

// ── CATEGORIES ──
async function loadCategories() {
  discoverContainer.innerHTML = '';
  for (const cat of categories) {
    const section = document.createElement('div');
    section.className = 'genre-row';
    const cleanName = cat.name.replace(/\s+/g, '');
    section.innerHTML = `
      <div class="row-header">
        <div class="row-title" onclick="goSeeMore('${cat.endpoint}','${cat.name}')" title="See all">
          ${cat.name}
          <span class="arrow">Explore all <i class="bi bi-chevron-right"></i></span>
        </div>
        <span class="see-all" onclick="goSeeMore('${cat.endpoint}','${cat.name}')">See All</span>
      </div>
      <div class="scroll-track-outer">
        <button class="scroll-btn left" onclick="scrollRow('${cleanName}', -1)"><i class="bi bi-chevron-left"></i></button>
        <div class="scroll-track" id="${cleanName}"></div>
        <button class="scroll-btn right" onclick="scrollRow('${cleanName}', 1)"><i class="bi bi-chevron-right"></i></button>
      </div>
    `;
    discoverContainer.appendChild(section);
    const results = await fetchEndpoint(cat.endpoint);
    displayItems(results, cleanName);
  }
}

function scrollRow(id, dir) {
  const el = document.getElementById(id);
  if (el) el.scrollBy({ left: dir * 600, behavior: 'smooth' });
}

async function fetchEndpoint(endpoint) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const res = await fetch(`https://api.themoviedb.org/3/${endpoint}${separator}api_key=${apiKey}&language=en-US`);
  const data = await res.json();
  return data.results || [];
}

function displayItems(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  items.slice(0, 30).forEach(item => {
    const c = createCard(item);
    if (c) container.appendChild(c);
  });
}

function buildDest(item, mediaType, poster) {
  const id = item.id;
  const title = encodeURIComponent(item.title || item.name || '');
  const overview = encodeURIComponent(item.overview || '');
  const release = encodeURIComponent(item.release_date || item.first_air_date || '');
  const p = encodeURIComponent(poster);
  return mediaType === 'tv'
    ? `tv-watch.html?id=${id}&title=${title}&poster=${p}&overview=${overview}&release=${release}`
    : `watch.html?id=${id}&title=${title}&poster=${p}&overview=${overview}&release=${release}`;
}

function createCard(item) {
  if (!item.poster_path) return null;
  const card = document.createElement('div');
  card.className = 'movie-card';

  const poster = `https://image.tmdb.org/t/p/w342${item.poster_path}`;
  const title = item.title || item.name || 'Untitled';
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const dest = buildDest(item, mediaType, `https://image.tmdb.org/t/p/w500${item.poster_path}`);

  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  const isFav = favorites.some(f => f.id === item.id);

  card.innerHTML = `
    <div class="card-inner">
      <img src="${poster}" alt="${title}" loading="lazy" />
      <div class="card-overlay">
        <div class="card-title-hover">${title}</div>
        <div class="card-actions">
          <div class="card-btn play" title="Play"><i class="bi bi-play-fill"></i></div>
          <div class="card-btn fav-heart" title="Favorite">${isFav ? '❤️' : '🤍'}</div>
          ${rating ? `<span class="card-rating">★ ${rating}</span>` : ''}
        </div>
      </div>
    </div>
  `;

  card.querySelector('.card-btn.play').onclick = e => { e.stopPropagation(); window.location.href = dest; };
  const heartBtn = card.querySelector('.fav-heart');
  heartBtn.onclick = e => {
    e.stopPropagation();
    toggleFavorite({ id: item.id, title, poster, type: mediaType }, heartBtn);
  };
  card.onclick = () => window.location.href = dest;
  return card;
}

function toggleFavorite(item, btn) {
  let favs = JSON.parse(localStorage.getItem('favorites')) || [];
  const i = favs.findIndex(f => f.id === item.id);
  if (i > -1) { favs.splice(i, 1); btn.innerHTML = '🤍'; }
  else { favs.push(item); btn.innerHTML = '❤️'; }
  localStorage.setItem('favorites', JSON.stringify(favs));
}

function goSeeMore(endpoint, name) {
  window.location.href = `see-more.html?category=${encodeURIComponent(name)}&endpoint=${encodeURIComponent(endpoint)}`;
}

// ── INIT ──
loadHero();
loadCategories();
loadGenres();
