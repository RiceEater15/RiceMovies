const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");
const title = decodeURIComponent(params.get("title"));
const poster = decodeURIComponent(params.get("poster"));
const overview = decodeURIComponent(params.get("overview"));
const release = decodeURIComponent(params.get("release"));

// Update movie details
document.getElementById("movieTitle").textContent = title;
document.getElementById("movieTitleText").textContent = title;
document.getElementById("moviePoster").src = poster;
document.getElementById("moviePoster").alt = title;
document.getElementById("releaseDate").textContent = release || 'Unknown';
document.getElementById("movieOverview").textContent = overview || 'No overview available.';

// Server sources
const sources = {
  "2embed.cc": `https://www.2embed.cc/embed/${movieId}`,
  "videasy": `https://player.videasy.net/movie/${movieId}`,
  "111movies": `https://111movies.com/movie/${movieId}`,
  "moviesapi.to": `https://moviesapi.to/movie/${movieId}`,
  "embed.su": `https://embed.su/embed/movie/${movieId}`,
  "multiembed.mov": `https://multiembed.mov/directstream.php?video_id=${movieId}&tmdb=1`,
  "vidlinks": `https://vidlink.pro/movie/${movieId}`,
  "123embed": `https://play2.123embed.net/movie/${movieId}`
};

// Handle server selection
const serverSelect = document.getElementById("serverSelect");
const player = document.getElementById("player");

serverSelect.addEventListener("change", () => {
  const selectedServer = serverSelect.value;
  player.src = sources[selectedServer];
});

// Load first server by default
serverSelect.dispatchEvent(new Event("change"));

// Fetch and display cast
const toggleCast = document.getElementById("toggleCast");
const actorsContainer = document.getElementById("actors");

toggleCast.addEventListener("click", () => {
  const isVisible = actorsContainer.style.display !== "none";
  actorsContainer.style.display = isVisible ? "none" : "grid";
  toggleCast.textContent = isVisible ? "Show Cast" : "Hide Cast";
});

fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=1070730380f5fee0d87cf0382670b255`)
  .then(res => res.json())
  .then(data => {
    const cast = data.cast?.slice(0, 10) || [];
    actorsContainer.innerHTML = cast.map(actor => `
      <div class="actor-card">
        <img src="https://image.tmdb.org/t/p/w185${actor.profile_path}" alt="${actor.name}" onerror="this.src='https://via.placeholder.com/185x278?text=No+Image'">
        <div class="actor-info">
          <h5>${actor.name}</h5>
          <p>${actor.character}</p>
        </div>
      </div>
    `).join('');
  })
  .catch(() => {
    actorsContainer.innerHTML = "<em>Failed to load cast information.</em>";
  }); 