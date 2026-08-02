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
  const panel = document.getElementById('genrePanel');
  if (panel) panel.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
}

async function handleSearch(query) {
  if (!query) { clearSearch(); return; }
  discoverContainer.style.display = 'none';
  heroEl.style.display = 'none';
  searchResultsPane.classList.add('visible');

  const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US`);
  const data = await res.json();
  const grid = document.getElementById('searchGrid');
  grid.innerHTML = '';
  const items = data.results.filter(r => r.media_type !== 'person' && r.poster_path);
  if (!items.length) {
    grid.innerHTML = `<p style="color:var(--muted); grid-column:1/-1">No results for "${query}"</p>`;
    return;
  }
  items.forEach(item => { const c = createCard(item); if (c) grid.appendChild(c); });
}

// ── GENRES ──
let movieGenres = [], tvGenres = [];

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
        border-radius:10px; padding:16px; width:300px; max-height:70vh; overflow-y:auto; z-index:999;
        display:none; box-shadow:0 10px 30px rgba(0,0,0,.6); }
      .genre-panel.open { display:block; }
      .genre-panel h4 { color:#aaa; font-size:.75rem; text-transform:uppercase; letter-spacing:.05em;
        margin:12px 0 8px; }
      .genre-panel h4:first-child { margin-top:0; }
      .genre-chip-list { display:flex; flex-wrap:wrap; gap:8px; }
      .genre-chip { background:#232323; color:#eee; border:1px solid #333; border-radius:20px;
        padding:6px 14px; font-size:.85rem; cursor:pointer; transition:background .2s,border-color .2s; }
      .genre-chip:hover, .genre-chip.active { background:#e50914; border-color:#e50914; color:#fff; }
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

  // Dropdown panel with genre chips
  let panel = document.getElementById('genrePanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'genrePanel';
    panel.className = 'genre-panel';
    document.body.appendChild(panel);
  }
  panel.innerHTML = `
    <h4>Movies</h4>
    <div class="genre-chip-list">
      ${movieGenres.map(g => `<div class="genre-chip" data-type="movie" data-id="${g.id}">${g.name}</div>`).join('')}
    </div>
    <h4>TV Shows</h4>
    <div class="genre-chip-list">
      ${tvGenres.map(g => `<div class="genre-chip" data-type="tv" data-id="${g.id}">${g.name}</div>`).join('')}
    </div>
  `;

  toggleBtn.onclick = e => {
    e.stopPropagation();
    panel.classList.toggle('open');
  };
  document.addEventListener('click', e => {
    if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== toggleBtn) {
      panel.classList.remove('open');
    }
  });

  panel.querySelectorAll('.genre-chip').forEach(chip => {
    chip.onclick = () => {
      panel.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      browseByGenre(chip.dataset.type, chip.dataset.id, chip.textContent);
      panel.classList.remove('open');
    };
  });
}

async function browseByGenre(type, genreId, genreName) {
  discoverContainer.style.display = 'none';
  heroEl.style.display = 'none';
  searchInputWrap.classList.remove('open');
  searchInput.value = '';
  searchResultsPane.classList.add('visible');

  const grid = document.getElementById('searchGrid');
  grid.innerHTML = `<p style="color:var(--muted); grid-column:1/-1">Loading ${genreName}...</p>`;

  const endpoint = `discover/${type}?with_genres=${genreId}&sort_by=popularity.desc`;
  const results = await fetchEndpoint(endpoint);

  grid.innerHTML = '';
  const heading = document.createElement('h2');
  heading.style.cssText = 'grid-column:1/-1; color:#fff; font-size:1.4rem; margin:0 0 4px; font-weight:600;';
  heading.textContent = `${genreName} ${type === 'tv' ? 'TV Shows' : 'Movies'}`;
  grid.appendChild(heading);

  const items = results.filter(r => r.poster_path);
  if (!items.length) {
    grid.innerHTML += `<p style="color:var(--muted); grid-column:1/-1">No results found.</p>`;
    return;
  }
  items.forEach(item => {
    item.media_type = type;
    const c = createCard(item);
    if (c) grid.appendChild(c);
  });
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