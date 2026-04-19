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
  const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&language=en-US`);
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
