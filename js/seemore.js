const apiKey = '1070730380f5fee0d87cf0382670b255';
const params = new URLSearchParams(window.location.search);
const category = params.get("category");
const endpoint = params.get("endpoint");

document.getElementById("genreTitle").textContent = category;

fetch(`https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&language=en-US`)
  .then(res => res.json())
  .then(data => {
    const results = data.results || [];
    const container = document.getElementById("movieGrid");
    container.innerHTML = "";

    results.forEach(item => {
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
        <div class="info-overlay">⭐ ${rating} &nbsp;&nbsp; 📅 ${release}</div>
        <h5>${title}</h5>
      `;

      card.onclick = () => {
        const destination = mediaType === "tv"
          ? `tv-watch.html?id=${id}&title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster)}&overview=${overview}&release=${encodeURIComponent(release)}`
          : `watch.html?id=${id}&title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster)}&overview=${overview}&release=${encodeURIComponent(release)}`;
        window.location.href = destination;
      };

      container.appendChild(card);
    });
  });
