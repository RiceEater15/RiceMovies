const apiKey = '1070730380f5fee0d87cf0382670b255';

const params = new URLSearchParams(window.location.search);
const endpoint = params.get("endpoint");
const title = params.get("title");

document.getElementById("pageTitle").textContent = title || "See More";

async function fetchMore() {
  const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&language=en-US`;
  const res = await fetch(url);
  const data = await res.json();
  displayItems(data.results || []);
}

function displayItems(items) {
  const container = document.getElementById("resultsContainer");
  container.innerHTML = '';

  items.forEach(item => {
    if (!item.poster_path) return;

    const card = document.createElement("div");
    card.className = "movie-card";

    const poster = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    const title = item.title || item.name || 'Untitled';
    const id = item.id;
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const overview = encodeURIComponent(item.overview || '');
    const release = item.release_date || item.first_air_date || '';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

    card.innerHTML = `
      <img src="${poster}" alt="${title}">
      <div class="info-overlay">⭐ ${rating} • 📅 ${release}</div>
      <h5>${title}</h5>
    `;

    card.onclick = () => {
      const dest = mediaType === "tv"
        ? `tv-watch.html?id=${id}&title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster)}&overview=${overview}&release=${encodeURIComponent(release)}`
        : `watch.html?id=${id}&title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster)}&overview=${overview}&release=${encodeURIComponent(release)}`;
      window.location.href = dest;
    };

    container.appendChild(card);
  });
}

fetchMore();
