const API_KEY = '39321ba3';
const BASE_URL = `https://www.omdbapi.com/?apikey=${API_KEY}&`;

let currentView = 'search';
let favoriteMovies = JSON.parse(localStorage.getItem('vaultFavorites')) || [];

const searchInput = document.getElementById('search-input');
const movieGrid = document.getElementById('movie-grid');
const viewTitle = document.getElementById('view-title');
const navSearchBtn = document.getElementById('nav-search');
const navFavBtn = document.getElementById('nav-favorites');
const favCountSpan = document.getElementById('fav-count');
const movieModal = document.getElementById('movie-modal');
const modalBody = document.getElementById('modal-body-data');
const closeModalBtn = document.querySelector('.close-modal');

// Initialize view
updateFavoriteBadge();
performSearch('Avengers'); // CHANGED: Automatically loads Avengers titles on initial application launch

/* ==========================================
   1. API Core Layer
   ========================================== */
async function performSearch(query) {
    if (!query) return;
    movieGrid.innerHTML = '<div class="message">Curating exquisite selections...</div>';
    
    try {
        const response = await fetch(`${BASE_URL}s=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.Response === "True") {
            renderGrid(data.Search);
        } else {
            movieGrid.innerHTML = `<div class="message">No masterpiece matches "${query}"</div>`;
        }
    } catch (error) {
        movieGrid.innerHTML = '<div class="message">Failed to link with cloud cinematic archives.</div>';
    }
}

async function showMovieDetails(imdbID) {
    modalBody.innerHTML = '<div class="message">Decrypting cinematic files...</div>';
    movieModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Lock background scroll seamlessly
    
    try {
        const response = await fetch(`${BASE_URL}i=${imdbID}&plot=full`);
        const movie = await response.json();
        
        if (movie.Response === "True") {
            const posterImg = movie.Poster !== 'N/A' ? movie.Poster : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=600';
            
            modalBody.innerHTML = `
                <div class="details-layout">
                    <div>
                        <img class="details-poster" src="${posterImg}" alt="${movie.Title}">
                    </div>
                    <div class="details-meta">
                        <h2>${movie.Title}</h2>
                        <div class="meta-tags">
                            <span class="tag rating">★ ${movie.imdbRating}</span>
                            <span class="tag">${movie.Rated}</span>
                            <span class="tag">${movie.Runtime}</span>
                            <span class="tag">${movie.Genre}</span>
                        </div>
                        <p class="details-plot">${movie.Plot}</p>
                        <div class="detail-line"><strong>Director</strong> ${movie.Director}</div>
                        <div class="detail-line"><strong>Ensemble Cast</strong> ${movie.Actors}</div>
                        <div class="detail-line"><strong>Release Date</strong> ${movie.Released}</div>
                        <div class="detail-line"><strong>Box Office</strong> ${movie.BoxOffice || 'N/A'}</div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        modalBody.innerHTML = '<div class="message">Error downloading database configuration files.</div>';
    }
}

/* ==========================================
   2. DOM Grid Interface Builder
   ========================================== */
function renderGrid(movies) {
    movieGrid.innerHTML = '';
    
    movies.forEach(movie => {
        const isFavorited = favoriteMovies.some(fav => fav.imdbID === movie.imdbID);
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.setAttribute('onclick', `showMovieDetails('${movie.imdbID}')`);
        
        const posterImg = movie.Poster !== 'N/A' ? movie.Poster : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400';
        
        card.innerHTML = `
            <div class="poster-wrapper">
                <img src="${posterImg}" alt="${movie.Title}" loading="lazy">
            </div>
            <div class="movie-info">
                <h3 title="${movie.Title}">${movie.Title}</h3>
                <p>${movie.Year} • ${movie.Type}</p>
                <div class="action-row">
                    <button class="btn info-btn">Explore Masterpiece</button>
                    <button 
                        class="btn fav-btn ${isFavorited ? 'is-fav' : ''}" 
                        data-id="${movie.imdbID}"
                        data-title="${escapeHTML(movie.Title)}"
                        data-year="${movie.Year}"
                        data-poster="${posterImg}"
                        data-type="${movie.Type}"
                        onclick="event.stopPropagation(); handleFavoriteToggle(event);">
                        ${isFavorited ? '♥' : '♡'}
                    </button>
                </div>
            </div>
        `;
        movieGrid.appendChild(card);
    });
}

function displayFavoritesPage() {
    if (favoriteMovies.length === 0) {
        movieGrid.innerHTML = '<div class="message">Your personalized collection is currently empty. Click heart icons to build.</div>';
    } else {
        renderGrid(favoriteMovies);
    }
}

/* ==========================================
   3. Persistence & Interaction State Caching 
   ========================================== */
function handleFavoriteToggle(e) {
    const btn = e.currentTarget;
    const currentMovie = {
        imdbID: btn.dataset.id,
        Title: btn.dataset.title,
        Year: btn.dataset.year,
        Poster: btn.dataset.poster,
        Type: btn.dataset.type
    };

    const targetIndex = favoriteMovies.findIndex(fav => fav.imdbID === currentMovie.imdbID);

    if (targetIndex > -1) {
        favoriteMovies.splice(targetIndex, 1);
        btn.classList.remove('is-fav');
        btn.innerHTML = '♡';
        if (currentView === 'favorites') displayFavoritesPage();
    } else {
        favoriteMovies.push(currentMovie);
        btn.classList.add('is-fav');
        btn.innerHTML = '♥';
    }

    localStorage.setItem('vaultFavorites', JSON.stringify(favoriteMovies));
    updateFavoriteBadge();
}

function updateFavoriteBadge() {
    favCountSpan.textContent = favoriteMovies.length;
}

function escapeHTML(str) {
    return str.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
}

function closeModal() {
    movieModal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore underlying scrolling layout
}

/* ==========================================
   4. Controller Event Handlers
   ========================================== */
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    if (currentView !== 'search') switchToSearchView();
    
    const value = e.target.value.trim();
    if (value.length > 2) {
        searchTimeout = setTimeout(() => performSearch(value), 400);
    }
});

closeModalBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === movieModal) closeModal();
});

navSearchBtn.addEventListener('click', switchToSearchView);
navFavBtn.addEventListener('click', () => {
    currentView = 'favorites';
    navSearchBtn.classList.remove('active-tab');
    navFavBtn.classList.add('active-tab');
    viewTitle.textContent = "Your Curated Vault";
    displayFavoritesPage();
});

function switchToSearchView() {
    currentView = 'search';
    navFavBtn.classList.remove('active-tab');
    navSearchBtn.classList.add('active-tab');
    viewTitle.textContent = "Trending Discoveries";
    if(searchInput.value.trim().length > 2) {
        performSearch(searchInput.value.trim());
    } else {
        performSearch('Avengers'); // CHANGED: Fallback baseline when search text is cleared
    }
}
