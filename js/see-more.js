const apiKey = '1070730380f5fee0d87cf0382670b255';
const params = new URLSearchParams(window.location.search);
const category = decodeURIComponent(params.get('category') || 'Browse');
const endpoint = params.get('endpoint');

document.getElementById('pageTitle').textContent = category;

let currentPage = 1, totalPages = 1;
const grid = document.getElementById('movieGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');

async function loadMovies(page = 1) {
  if (page === 1) {
    grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1"><div class="spinner"></div> Loading…</div>';
  }

  const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&language=en-US&page=${page}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    totalPages = data.total_pages || 1;
    if (page === 1) grid.innerHTML = '';

    (data.results || []).forEach(item => {
      const card = createCard(item);
      if (card) grid.appendChild(card);
    });

    loadMoreBtn.style.display = currentPage < totalPages ? 'inline-flex' : 'none';
  } catch {
    grid.innerHTML = `<p style="color:var(--muted);grid-column:1/-1">Failed to load. Please try again.</p>`;
  }
}

function createCard(item) {
  if (!item.poster_path) return null;
  const card = document.createElement('div');
  card.className = 'movie-card';

  const poster = `https://image.tmdb.org/t/p/w342${item.poster_path}`;
  const bigPoster = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
  const title = item.title || item.name || 'Untitled';
  const id = item.id;
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const release = item.release_date || item.first_air_date || '';
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

  const enc = s => encodeURIComponent(s);
  const dest = mediaType === 'tv'
    ? `tv-watch.html?id=${id}&title=${enc(title)}&poster=${enc(bigPoster)}&overview=${enc(item.overview || '')}&release=${enc(release)}`
    : `watch.html?id=${id}&title=${enc(title)}&poster=${enc(bigPoster)}&overview=${enc(item.overview || '')}&release=${enc(release)}`;

  card.innerHTML = `
    <img src="${poster}" alt="${title}" loading="lazy" />
    <div class="card-overlay">
      <div class="card-title">${title}</div>
      <div class="card-meta">
        ${rating ? `<span class="card-rating">★ ${rating}</span>` : ''}
        ${release ? `<span>${release.slice(0, 4)}</span>` : ''}
      </div>
    </div>
  `;
  card.onclick = () => window.location.href = dest;
  return card;
}

loadMoreBtn.onclick = () => {
  currentPage++;
  loadMovies(currentPage);
};

loadMovies(1);
