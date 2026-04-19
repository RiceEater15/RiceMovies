const apiKey = '1070730380f5fee0d87cf0382670b255';
const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "Category";
const endpoint = params.get("endpoint");

const genreTitle = document.getElementById("genreTitle");
const container = document.getElementById("movieGrid");

let currentPage = 1;
let totalPages = 1;

genreTitle.textContent = category;

function createMovieCard(item) {
  if (!item.poster_path) return null;

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
    <div class="info-overlay">⭐ ${rating} &nbsp;&nbsp; 📅 ${release}</div>
    <h5>${title}</h5>
  `;

  card.onclick = () => {
    const destination = mediaType === "tv"
      ? `tv-watch.html?id=${id}&title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster)}&overview=${overview}&release=${encodeURIComponent(release)}`
      : `watch.html?id=${id}&title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster)}&overview=${overview}&release=${encodeURIComponent(release)}`;
    window.location.href = destination;
  };

  return card;
}

async function loadMovies(page = 1) {
  const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&language=en-US&page=${page}`;
  const res = await fetch(url);
  const data = await res.json();

  totalPages = data.total_pages || 1;

  data.results.forEach(item => {
    const card = createMovieCard(item);
    if (card) container.appendChild(card);
  });

  if (currentPage >= totalPages) {
    loadMoreBtn.style.display = "none";
  } else {
    loadMoreBtn.style.display = "block";
  }
}

const loadMoreBtn = document.createElement("button");
loadMoreBtn.textContent = "Load More";
loadMoreBtn.className = "see-more-btn";
loadMoreBtn.style.display = "none";
loadMoreBtn.onclick = () => {
  if (currentPage < totalPages) {
    currentPage++;
    loadMovies(currentPage);
  }
};

document.querySelector(".discover-section").appendChild(loadMoreBtn);

loadMovies(currentPage);
