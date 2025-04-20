const apiKey = '1070730380f5fee0d87cf0382670b255';
const searchInput = document.getElementById('searchInput');
const movieList = document.getElementById('movieList');
const pageCircles = document.getElementById('pageCircles');

let currentPage = 1;
let totalPages = 1;
let currentQuery = '';

document.addEventListener("DOMContentLoaded", () => {
  fetchPopularMovies();
});

function updatePage() {
  if (currentQuery) {
    searchMovies(currentQuery);
  } else {
    fetchPopularMovies();
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

async function fetchPopularMovies() {
  const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=${currentPage}`);
  const data = await res.json();
  totalPages = Math.min(3, data.total_pages); // Limit to 3 pages
  displayMovies(data.results);
  updatePageCircles();
}

async function searchMovies(query) {
  currentQuery = query;
  const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}&language=en-US&page=${currentPage}`);
  const data = await res.json();
  totalPages = Math.min(3, data.total_pages); // Limit to 3 pages
  displayMovies(data.results);
  updatePageCircles();
}

function displayMovies(movies) {
  movieList.innerHTML = '';

  // Determine number of movies based on screen width
  let maxMovies = 12; // Default: 3 rows of 4
  if (window.innerWidth <= 768) {
    maxMovies = 6; // 3 rows of 2
  }
  if (window.innerWidth <= 480) {
    maxMovies = 2; // 2 rows of 1
  }

  // Limit movies based on screen size
  const limitedMovies = movies.slice(0, maxMovies);

  limitedMovies.forEach(movie => {
    if (!movie.poster_path) return;

    const card = document.createElement('div');
    card.className = 'movie-card';

    const poster = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    const title = encodeURIComponent(movie.title);
    const id = movie.id;
    const overview = encodeURIComponent(movie.overview || '');
    const release = encodeURIComponent(movie.release_date || '');

    card.innerHTML = `
      <img src="${poster}" alt="${movie.title}" />
      <h5>${movie.title}</h5>
    `;

    card.onclick = () => {
      window.location.href = `watch.html?id=${id}&title=${title}&poster=${encodeURIComponent(poster)}&overview=${overview}&release=${release}`;
    };

    movieList.appendChild(card);
  });
}

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  currentPage = 1;
  if (query) {
    searchMovies(query);
  } else {
    currentQuery = '';
    fetchPopularMovies();
  }
}); 