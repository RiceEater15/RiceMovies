const params = new URLSearchParams(window.location.search);
const showId = params.get('id');
const title = decodeURIComponent(params.get('title') || '');
const poster = decodeURIComponent(params.get('poster') || '');
const overview = decodeURIComponent(params.get('overview') || '');
const release = decodeURIComponent(params.get('release') || '');

const player = document.getElementById('player');
let currentSeason = 1, currentEpisode = 1, currentSource = 'Primary';

// Fill details
document.getElementById('showTitle').textContent = title;
document.getElementById('showTitleText').textContent = title;
document.getElementById('showPoster').src = poster;
document.getElementById('showOverview').textContent = overview || 'No overview available.';

const metaEl = document.getElementById('showMeta');
if (release) metaEl.innerHTML += `<span class="meta-chip"><i class="bi bi-calendar3"></i> ${release.slice(0, 4)}</span>`;
metaEl.innerHTML += `<span class="meta-chip"><i class="bi bi-tv"></i> TV Series</span>`;

// Sources
const buildSources = () => ({
  'Primary':   `https://vidrock.net/tv/${showId}/${currentSeason}/${currentEpisode}?download=false`,
  'Secondary': `https://www.2embed.cc/embedtv/${showId}&s=${currentSeason}&e=${currentEpisode}`,
  'Videasy':   `https://player.videasy.net/tv/${showId}/${currentSeason}/${currentEpisode}`,
  'Tertiary':  `https://111movies.com/tv/${showId}/${currentSeason}/${currentEpisode}`,
  'Backup':    `https://moviesapi.to/tv/${showId}-${currentSeason}-${currentEpisode}`,
  'Embed.su':  `https://embed.su/embed/tv/${showId}/${currentSeason}/${currentEpisode}`,
  'MultiEmbed':`https://multiembed.mov/directstream.php?video_id=${showId}&tmdb=1&s=${currentSeason}&e=${currentEpisode}`,
  'VidLinks':  `https://vidlink.pro/tv/${showId}/${currentSeason}/${currentEpisode}`,
  '123Embed':  `https://play2.123embed.net/tv/${showId}/${currentSeason}/${currentEpisode}`,
});

const pillsContainer = document.getElementById('serverPills');
const serverNames = ['Primary', 'Secondary', 'Videasy', 'Tertiary', 'Backup', 'Embed.su', 'MultiEmbed', 'VidLinks', '123Embed'];

serverNames.forEach((name, i) => {
  const pill = document.createElement('button');
  pill.className = 'server-pill' + (i === 0 ? ' active' : '');
  pill.textContent = name;
  pill.onclick = () => {
    document.querySelectorAll('.server-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentSource = name;
    updateIframe();
  };
  pillsContainer.appendChild(pill);
});

function updateIframe() {
  player.src = buildSources()[currentSource] || '';
}

// Download
document.getElementById('downloadBtn').onclick = () => {
  window.open(`https://dl.vidsrc.vip/tv/${showId}/${currentSeason}/${currentEpisode}`, '_blank');
};

// Toggle episodes
const toggleEpisodesBtn = document.getElementById('toggleEpisodes');
const episodeListEl = document.getElementById('episodeList');
toggleEpisodesBtn.onclick = () => {
  const open = episodeListEl.style.display !== 'none';
  episodeListEl.style.display = open ? 'none' : 'block';
  toggleEpisodesBtn.innerHTML = open
    ? '<i class="bi bi-list"></i> Episodes'
    : '<i class="bi bi-x"></i> Close';
};

// Season select
fetch(`https://api.themoviedb.org/3/tv/${showId}?api_key=1070730380f5fee0d87cf0382670b255`)
  .then(r => r.json())
  .then(data => {
    const seasons = data.number_of_seasons || 1;
    const seasonSelect = document.getElementById('seasonSelect');
    for (let i = 1; i <= seasons; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Season ${i}`;
      seasonSelect.appendChild(opt);
    }
    loadEpisodes(1);
  });

document.getElementById('seasonSelect').addEventListener('change', e => {
  currentSeason = parseInt(e.target.value);
  loadEpisodes(currentSeason);
});

function loadEpisodes(season) {
  fetch(`https://api.themoviedb.org/3/tv/${showId}/season/${season}?api_key=1070730380f5fee0d87cf0382670b255`)
    .then(r => r.json())
    .then(data => {
      episodeListEl.innerHTML = '';
      const eps = data.episodes || [];
      eps.forEach((ep, i) => {
        const item = document.createElement('div');
        item.className = 'episode-item' + (i === 0 ? ' active' : '');
        item.innerHTML = `
          <span class="ep-name">E${i + 1}: ${ep.name || 'Untitled'}</span>
          <span class="ep-date">${ep.air_date ? new Date(ep.air_date).toLocaleDateString() : ''}</span>
        `;
        item.onclick = () => {
          document.querySelectorAll('.episode-item').forEach(e => e.classList.remove('active'));
          item.classList.add('active');
          currentEpisode = i + 1;
          document.getElementById('episodeNumber').textContent = ep.episode_number;
          document.getElementById('episodeName').textContent = ep.name || 'Untitled';
          document.getElementById('epSeason').textContent = season;
          updateIframe();
        };
        episodeListEl.appendChild(item);
      });

      if (eps.length) {
        currentEpisode = 1;
        document.getElementById('episodeNumber').textContent = eps[0].episode_number || 1;
        document.getElementById('episodeName').textContent = eps[0].name || 'Untitled';
        document.getElementById('epSeason').textContent = season;
        updateIframe();
      }
    });
}

// Cast (lazy load)
const toggleCastBtn = document.getElementById('toggleCast');
const actorsEl = document.getElementById('actors');
let castLoaded = false;

toggleCastBtn.onclick = () => {
  const visible = actorsEl.style.display !== 'none';
  actorsEl.style.display = visible ? 'none' : 'grid';
  toggleCastBtn.textContent = visible ? 'Show Cast' : 'Hide Cast';
  if (!castLoaded) loadCast();
};

async function loadCast() {
  castLoaded = true;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${showId}/credits?api_key=1070730380f5fee0d87cf0382670b255`);
    const data = await res.json();
    const cast = (data.cast || []).slice(0, 12);
    actorsEl.innerHTML = cast.length
      ? cast.map(a => `
        <div class="actor-card">
          <img src="${a.profile_path ? 'https://image.tmdb.org/t/p/w185' + a.profile_path : 'https://placehold.co/185x278/222/666?text=?'}" alt="${a.name}" loading="lazy" />
          <div class="actor-info"><h5>${a.name}</h5><p>${a.character}</p></div>
        </div>
      `).join('')
      : '<em style="color:var(--muted)">No cast info.</em>';
  } catch {
    actorsEl.innerHTML = '<em style="color:var(--muted)">Failed to load.</em>';
  }
}
