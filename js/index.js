const apiKey = '1070730380f5fee0d87cf0382670b255';

const categories = [
  { name: "Trending", endpoint: "trending/all/week" },
  { name: "Movies", endpoint: "movie/popular" },
  { name: "TV Shows", endpoint: "tv/popular" },
  { name: "Top Rated Movies", endpoint: "movie/top_rated" },
  { name: "Top Rated TV", endpoint: "tv/top_rated" },
  { name: "Reality TV", endpoint: "discover/tv?with_genres=10764" },
  { name: "Documentaries", endpoint: "discover/tv?with_genres=99" },
];

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
});

async function loadCategories() {
  const container = document.getElementById('discoverContainer');
  container.innerHTML = '';

  for (const category of categories) {
    const section = document.createElement('div');
    section.className = 'genre-row';
    section.innerHTML = `
      <div class="genre-title-row">
        <a href="#" class="genre-title" onclick="goToSeeMore('${category.endpoint}', '${category.name}'); return false;">${category.name}</a>
      </div>
      <div class="scroll-container" id="${category.name.replace(/\s+/g, '')}"></div>
    `;
    container.appendChild(section);

    const results = await fetchData(category.endpoint);
    displayItems(results, category.name.replace(/\s+/g, ''));
  }
}

async function fetchData(endpoint) {
  const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&language=en-US`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

function displayItems(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

  items.slice(0, 50).forEach(item => {
    if (!item.poster_path) return;

    const card = document.createElement('div');
    card.className = 'movie-card';

    const poster = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    const title = item.title || item.name || 'Untitled';
    const id = item.id;
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const overview = encodeURIComponent(item.overview || '');
    const release = item.release_date || item.first_air_date || '';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

    const isFavorite = favorites.some(f => f.id == id && f.mediaType === mediaType);

    card.innerHTML = `
      <img src="${poster}" alt="${title}" />
      <div class="info-overlay">⭐ ${rating} • 📅 ${release}</div>
      <h5>${title}</h5>
      <button class="fav-btn" onclick="toggleFavorite(event, '${id}', '${mediaType}', '${encodeURIComponent(title)}', '${encodeURIComponent(poster)}', '${overview}', '${encodeURIComponent(release)}')">
        ${isFavorite ? '💖' : '❤️'}
      </button>
    `;

    card.onclick = () => {
      const destination = mediaType === 'tv'
        ? `tv-watch.html?id=${id}&title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster)}&overview=${overview}&release=${encodeURIComponent(release)}`
        : `watch.html?id=${id}&title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster)}&overview=${overview}&release=${encodeURIComponent(release)}`;
      window.location.href = destination;
    };

    container.appendChild(card);
  });
}

function toggleFavorite(event, id, mediaType, title, poster, overview, release) {
  event.stopPropagation();

  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  const exists = favorites.find(item => item.id == id && item.mediaType === mediaType);

  if (exists) {
    const updated = favorites.filter(item => !(item.id == id && item.mediaType === mediaType));
    localStorage.setItem('favorites', JSON.stringify(updated));
    event.target.textContent = '❤️';
  } else {
    favorites.push({ id, mediaType, title, poster, overview, release });
    localStorage.setItem('favorites', JSON.stringify(favorites));
    event.target.textContent = '💖';
  }
}

const searchInput = document.getElementById('searchInput');
searchInput.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  const container = document.getElementById('discoverContainer');
  if (!query) return loadCategories();

  const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US`);
  const data = await res.json();

  const movies = data.results.filter(r => r.media_type === 'movie');
  const tvShows = data.results.filter(r => r.media_type === 'tv');

  container.innerHTML = '';

  if (movies.length > 0) {
    const movieRow = document.createElement('div');
    movieRow.className = 'genre-row';
    movieRow.innerHTML = `<div class="genre-title">Movies</div><div class="scroll-container" id="SearchMovies"></div>`;
    container.appendChild(movieRow);
    displayItems(movies, 'SearchMovies');
  }

  if (tvShows.length > 0) {
    const tvRow = document.createElement('div');
    tvRow.className = 'genre-row';
    tvRow.innerHTML = `<div class="genre-title">TV Shows</div><div class="scroll-container" id="SearchTV"></div>`;
    container.appendChild(tvRow);
    displayItems(tvShows, 'SearchTV');
  }

  if (movies.length === 0 && tvShows.length === 0) {
    container.innerHTML = `<div class="genre-title">No results found.</div>`;
  }
});

function goToSeeMore(endpoint, name) {
  const urlName = encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
  window.location.href = `see-more.html?category=${urlName}&endpoint=${encodeURIComponent(endpoint)}`;
}
