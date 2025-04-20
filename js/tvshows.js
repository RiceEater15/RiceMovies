const apiKey = '1070730380f5fee0d87cf0382670b255';
const searchInput = document.getElementById('searchInput');
const movieList = document.getElementById('movieList');
const pageCircles = document.getElementById('pageCircles');

let currentPage = 1;
let totalPages = 1;
let currentQuery = '';

document.addEventListener("DOMContentLoaded", () => {
  fetchPopularTV();
});

function updatePage() {
  if (currentQuery) {
    searchTV(currentQuery);
  } else {
    fetchPopularTV();
  }
  updatePageCircles();
}

function updatePageCircles() {
  pageCircles.innerHTML = '';
  
  // Show exactly 3 pages
  const maxVisiblePages = 3;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const circle = document.createElement('div');
    circle.className = `page-circle ${i === currentPage ? 'active' : ''}`;
    circle.onclick = () => {
      currentPage = i;
      updatePage();
    };
    pageCircles.appendChild(circle);
  }
}

async function fetchPopularTV() {
  const res = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=en-US&page=${currentPage}`);
  const data = await res.json();
  totalPages = Math.min(3, data.total_pages); // Limit to 3 pages
  displayTV(data.results);
  updatePageCircles();
}

async function searchTV(query) {
  currentQuery = query;
  const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${query}&language=en-US&page=${currentPage}`);
  const data = await res.json();
  totalPages = Math.min(3, data.total_pages); // Limit to 3 pages
  displayTV(data.results);
  updatePageCircles();
}

function displayTV(shows) {
  movieList.innerHTML = '';

  // Determine number of shows based on screen width
  let maxShows = 12; // Default: 3 rows of 4
  if (window.innerWidth <= 768) {
    maxShows = 6; // 3 rows of 2
  }
  if (window.innerWidth <= 480) {
    maxShows = 2; // 2 rows of 1
  }

  // Limit shows based on screen size
  const limitedShows = shows.slice(0, maxShows);

  limitedShows.forEach(show => {
    if (!show.poster_path) return;

    const card = document.createElement('div');
    card.className = 'movie-card';

    const poster = `https://image.tmdb.org/t/p/w500${show.poster_path}`;
    const title = encodeURIComponent(show.name);
    const id = show.id;
    const overview = encodeURIComponent(show.overview || '');
    const release = encodeURIComponent(show.first_air_date || '');

    card.innerHTML = `
      <img src="${poster}" alt="${show.name}" />
      <h5>${show.name}</h5>
    `;

    card.onclick = () => {
      window.location.href = `tv-watch.html?id=${id}&title=${title}&poster=${encodeURIComponent(poster)}&overview=${overview}&release=${release}`;
    };

    movieList.appendChild(card);
  });
}

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  currentPage = 1;
  if (query) {
    searchTV(query);
  } else {
    currentQuery = '';
    fetchPopularTV();
  }
}); 