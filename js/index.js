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
        <a href="#" class="genre-title" onclick="goToSeeMore('${category.endpoint}', '${category.name}'); return false;">
          ${category.name}
        </a>
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

  items.slice(0, 50).forEach(item => {
    if (!item.poster_path) return;

    const id = item.id;
    const title = item.title || item.name || 'Untitled';
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const poster = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    const release = item.release_date || item.first_air_date || '';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
    const overview = encodeURIComponent(item.overview || '');
    const isFav = checkFavorite(id);

    const card = document.createElement('div');
    card.className = 'movie-card';
    card.style.position = 'relative';

    const favBtn = document.createElement('div');
    favBtn.textContent = isFav ? '❤️' : '♡';
    favBtn.style.position = 'absolute';
    favBtn.style.top = '8px';
    favBtn.style.right = '8px';
    favBtn.style.fontSize = '22px';
    favBtn.style.cursor = 'pointer';
    favBtn.style.color = isFav ? '#ff3366' : 'rgba(255,255,255,0.8)';
    favBtn.style.zIndex = '10';
    favBtn.style.userSelect = 'none';

    favBtn.onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(id, title, poster, mediaType, favBtn);
    };

    card.innerHTML = `
      <img src="${poster}" alt="${title}" style="width:100%; border-radius:10px;" />
      <div style="position:absolute;bottom:5px;left:5px;font-size:14px;color:white;text-shadow:0 0 5px black;">⭐ ${rating} • 📅 ${release}</div>
      <h5 style="margin-top:8px;color:white;">${title}</h5>
    `;

    card.prepend(favBtn);

    card.onclick = (e) => {
      if (e.target === favBtn) return;
      const destination = mediaType === 'tv'
        ? `tv-watch.html?id=${id}&title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster)}&overview=${overview}&release=${encodeURIComponent(release)}`
        : `watch.html?id=${id}&title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster)}&overview=${overview}&release=${encodeURIComponent(release)}`;
      window.location.href = destination;
    };

    container.appendChild(card);
  });
}

function toggleFavorite(id, title, poster, type, btn) {
  const favs = JSON.parse(localStorage.getItem('favorites')) || [];
  const exists = favs.find(item => item.id === id);

  if (exists) {
    const updated = favs.filter(item => item.id !== id);
    localStorage.setItem('favorites', JSON.stringify(updated));
    btn.textContent = '♡';
    btn.style.color = 'rgba(255,255,255,0.8)';
  } else {
    favs.push({ id, title, poster, type });
    localStorage.setItem('favorites', JSON.stringify(favs));
    btn.textContent = '❤️';
    btn.style.color = '#ff3366';
  }
}

function checkFavorite(id) {
  const favs = JSON.parse(localStorage.getItem('favorites')) || [];
  return favs.some(item => item.id === id);
}

function goToSeeMore(endpoint, name) {
  const urlName = encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
  window.location.href = `see-more.html?category=${urlName}&endpoint=${encodeURIComponent(endpoint)}`;
}
