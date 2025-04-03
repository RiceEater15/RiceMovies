function filterMovies() {
    let input = document.getElementById('searchInput');
    let filter = input.value.toUpperCase();
    let movieList = document.getElementById('movieList');
    let movies = movieList.getElementsByTagName('li');

    for (let i = 0; i < movies.length; i++) {
        let movie = movies[i];
        let movieText = movie.textContent || movie.innerText;
        if (movieText.toUpperCase().indexOf(filter) > -1) {
            movie.classList.remove('hidden');
        } else {
            movie.classList.add('hidden');
        }
    }
}
