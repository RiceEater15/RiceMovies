const params = new URLSearchParams(window.location.search);
const showId = params.get("id");
const title = params.get("title");
const poster = params.get("poster");
const overview = params.get("overview");
const release = params.get("release");

const showInfo = document.getElementById("showInfo");
const showTitle = document.getElementById("showTitle");
const player = document.getElementById("player");

let currentSeason = 1;
let currentEpisode = 1;

showTitle.textContent = title;

const showInfoContent = showInfo.querySelector('.show-info-content');
showInfoContent.innerHTML = `
  <img src="${poster}" alt="${title}" />
  <div class="show-text">
    <h3>${title}</h3>
    <p><strong>First Air Date:</strong> ${release || 'Unknown'}</p>
    <p><strong>Overview:</strong> ${overview || 'No overview available.'}</p>
  </div>
`;

fetch(`https://api.themoviedb.org/3/tv/${showId}/credits?api_key=1070730380f5fee0d87cf0382670b255`)
  .then(res => res.json())
  .then(data => {
    const castContainer = document.getElementById("actors");
    if (data.cast?.length > 0) {
      const topCast = data.cast.slice(0, 6);
      castContainer.innerHTML = topCast.map(actor => `
        <div class="actor-card">
          <img src="https://image.tmdb.org/t/p/w185${actor.profile_path}" alt="${actor.name}" onerror="this.src='https://via.placeholder.com/185x278?text=No+Image'">
          <div class="actor-info">
            <h5>${actor.name}</h5>
            <p>${actor.character}</p>
          </div>
        </div>
      `).join('');
    } else {
      castContainer.innerHTML = '<p>No cast information available.</p>';
    }
  })
  .catch(() => {
    document.getElementById("actors").innerHTML = "Failed to load cast.";
  });

fetch(`https://api.themoviedb.org/3/tv/${showId}?api_key=1070730380f5fee0d87cf0382670b255`)
  .then(res => res.json())
  .then(data => {
    const seasons = data.number_of_seasons || 1;
    const seasonSelect = document.getElementById("seasonSelect");
    seasonSelect.innerHTML = "";
    for (let i = 1; i <= seasons; i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i;
      seasonSelect.appendChild(opt);
    }
    loadEpisodes(currentSeason);
  });

document.getElementById("seasonSelect").addEventListener("change", e => {
  currentSeason = parseInt(e.target.value);
  loadEpisodes(currentSeason);
});

function loadEpisodes(season) {
  fetch(`https://api.themoviedb.org/3/tv/${showId}/season/${season}?api_key=1070730380f5fee0d87cf0382670b255`)
    .then(res => res.json())
    .then(data => {
      const episodeList = document.getElementById("episodeList");
      episodeList.innerHTML = "";
      const epCount = data.episodes?.length || 1;

      for (let i = 1; i <= epCount; i++) {
        const episode = data.episodes[i - 1];
        const episodeName = episode.name || "Untitled Episode";
        const episodeItem = document.createElement("div");
        episodeItem.className = "episode-item";
        episodeItem.innerHTML = `
          <div class="d-flex justify-content-between align-items-center">
            <span>Episode ${i}: ${episodeName}</span>
            <small class="text-muted">${episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'No date'}</small>
          </div>
        `;
        episodeItem.addEventListener("click", () => {
          currentEpisode = i;
          document.querySelectorAll(".episode-item").forEach(item => item.classList.remove("active"));
          episodeItem.classList.add("active");
          updateEpisodeInfo(episode);
          updateIframe();
        });
        episodeList.appendChild(episodeItem);
      }

      if (episodeList.firstChild) {
        episodeList.firstChild.classList.add("active");
        currentEpisode = 1;
        updateEpisodeInfo(data.episodes[0]);
        updateIframe();
      }
    });
}

function updateEpisodeInfo(episode) {
  document.getElementById("episodeNumber").textContent = episode.episode_number;
  document.getElementById("episodeName").textContent = episode.name || "Untitled Episode";
}

const serverSelect = document.getElementById("serverSelect");
let currentSource = serverSelect.value;

serverSelect.addEventListener("change", e => {
  currentSource = e.target.value;
  updateIframe();
});

function updateIframe() {
  const sources = {
    "2embed.cc": `https://www.2embed.cc/embedtv/${showId}&s=${currentSeason}&e=${currentEpisode}`,
    "embed.su": `https://embed.su/embed/tv/${showId}/${currentSeason}/${currentEpisode}`,
    "multiembed.mov": `https://multiembed.mov/directstream.php?video_id=${showId}&tmdb=1&s=${currentSeason}&e=${currentEpisode}`,
    "moviesapi.to": `https://moviesapi.to/tv/${showId}-${currentSeason}-${currentEpisode}`,
    "vidlinks": `https://vidlink.pro/tv/${showId}/${currentSeason}/${currentEpisode}`,
    "123embed": `https://play2.123embed.net/tv/${showId}/${currentSeason}/${currentEpisode}`,
    "111movies": `https://111movies.com/tv/${showId}/${currentSeason}/${currentEpisode}`,
    "videasy": `https://player.videasy.net/tv/${showId}/${currentSeason}/${currentEpisode}`
  };
  player.src = sources[currentSource];
}

updateIframe();

document.getElementById("toggleCast").addEventListener("click", () => {
  const castGrid = document.getElementById("actors");
  const btn = document.getElementById("toggleCast");
  if (castGrid.style.display === "none") {
    castGrid.style.display = "grid";
    btn.textContent = "Hide Cast";
  } else {
    castGrid.style.display = "none";
    btn.textContent = "Show Cast";
  }
});

document.getElementById("toggleEpisodes").addEventListener("click", () => {
  const episodeList = document.getElementById("episodeList");
  const btn = document.getElementById("toggleEpisodes");
  if (episodeList.style.display === "none") {
    episodeList.style.display = "block";
    btn.textContent = "Hide Episodes";
  } else {
    episodeList.style.display = "none";
    btn.textContent = "Show Episodes";
  }
});
