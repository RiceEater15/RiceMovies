const params = new URLSearchParams(window.location.search);
const movieId = params.get('id');
const title = decodeURIComponent(params.get('title') || '');
const poster = decodeURIComponent(params.get('poster') || '');
const overview = decodeURIComponent(params.get('overview') || '');
const release = decodeURIComponent(params.get('release') || '');

// Fill page content
document.getElementById('movieTitle').textContent = title;
document.getElementById('movieTitleText').textContent = title;
document.getElementById('moviePoster').src = poster;
document.getElementById('moviePoster').alt = title;
document.getElementById('movieOverview').textContent = overview || 'No overview available.';

// Meta chips
const metaEl = document.getElementById('movieMeta');
if (release) metaEl.innerHTML += `<span class="meta-chip"><i class="bi bi-calendar3"></i> ${release}</span>`;
metaEl.innerHTML += `<span class="meta-chip"><i class="bi bi-film"></i> Movie</span>`;

// Sources
const sources = {
  'Primary':   `https://vidrock.net/movie/${movieId}?download=false`,
  'Secondary': `https://www.2embed.cc/embed/${movieId}`,
  'Videasy':   `https://player.videasy.net/movie/${movieId}`,
  'Tertiary':  `https://111movies.com/movie/${movieId}`,
  'Backup':    `https://moviesapi.to/movie/${movieId}`,
  'Embed.su':  `https://embed.su/embed/movie/${movieId}`,
  'MultiEmbed':`https://multiembed.mov/directstream.php?video_id=${movieId}&tmdb=1`,
  'VidLinks':  `https://vidlink.pro/movie/${movieId}`,
  '123Embed':  `https://play2.123embed.net/movie/${movieId}`,
};

const player = document.getElementById('player');
const pillsContainer = document.getElementById('serverPills');

Object.entries(sources).forEach(([label], i) => {
  const pill = document.createElement('button');
  pill.className = 'server-pill' + (i === 0 ? ' active' : '');
  pill.textContent = label;
  pill.onclick = () => {
    document.querySelectorAll('.server-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    player.src = sources[label];
  };
  pillsContainer.appendChild(pill);
});

// Load first source
player.src = sources['Primary'];

// Download
document.getElementById('downloadBtn').onclick = () => window.open(`https://dl.vidsrc.vip/movie/${movieId}`, '_blank');

// Favorites
const favBtn = document.getElementById('favBtn');
let favs = JSON.parse(localStorage.getItem('favorites')) || [];
const isFav = () => favs.some(f => f.id === parseInt(movieId));

const updateFavBtn = () => {
  favBtn.innerHTML = isFav()
    ? '<i class="bi bi-heart-fill" style="color:#e50914"></i> In Favorites'
    : '<i class="bi bi-heart"></i> Add to Favorites';
};
updateFavBtn();

favBtn.onclick = () => {
  if (isFav()) favs = favs.filter(f => f.id !== parseInt(movieId));
  else favs.push({ id: parseInt(movieId), title, poster, type: 'movie' });
  localStorage.setItem('favorites', JSON.stringify(favs));
  updateFavBtn();
};

// Cast (lazy load)
const toggleCast = document.getElementById('toggleCast');
const actorsEl = document.getElementById('actors');
let castLoaded = false;

toggleCast.onclick = () => {
  const visible = actorsEl.style.display !== 'none';
  actorsEl.style.display = visible ? 'none' : 'grid';
  toggleCast.textContent = visible ? 'Show Cast' : 'Hide Cast';
  if (!castLoaded) loadCast();
};

async function loadCast() {
  castLoaded = true;
  actorsEl.innerHTML = '<em style="color:var(--muted)">Loading…</em>';
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=1070730380f5fee0d87cf0382670b255`);
    const data = await res.json();
    const cast = (data.cast || []).slice(0, 12);
    if (!cast.length) { actorsEl.innerHTML = '<em style="color:var(--muted)">No cast info.</em>'; return; }
    actorsEl.innerHTML = cast.map(a => `
      <div class="actor-card">
        <img src="${a.profile_path ? 'https://image.tmdb.org/t/p/w185' + a.profile_path : 'https://placehold.co/185x278/222/666?text=?'}" alt="${a.name}" loading="lazy" />
        <div class="actor-info"><h5>${a.name}</h5><p>${a.character}</p></div>
      </div>
    `).join('');
  } catch {
    actorsEl.innerHTML = '<em style="color:var(--muted)">Failed to load cast.</em>';
  }
}
