const API_KEY = '39321ba3';
const BASE_URL = `https://www.omdbapi.com/?apikey=${API_KEY}&`;

// State tracking variables
let currentView = 'search'; // 'search' or 'favorites'
let favoriteMovies = JSON.parse(localStorage.getItem('vaultFavorites')) || [];

// DOM Element references
const searchInput = document.getElementById('search-input');
const movieGrid = document.getElementById('movie-grid');
const viewTitle = document.getElementById('view-title');
const navSearchBtn = document.getElementById('nav-search');
const navFavBtn = document.getElementById('nav-favorites');
const favCountSpan = document.getElementById('fav-count');

// Initialize interface items
updateFavoriteBadge();
performSearch('Matrix'); // Pre-populate window with something clean on launch

/* ==========================================
   1. Data Fetch & API Management
   ========================================== */
async function performSearch(query) {
    if (!query) return;
    
    movieGrid.innerHTML = '<div class="message">Searching the vault...</div>';
    
    try {
        const response = await fetch(`${BASE_URL}s=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.Response === "True") {
            renderGrid(data.Search);
        } else {
            movieGrid.innerHTML = `<div class="message">No titles matched "${query}"</div>`;
        }
    } catch (error) {
        console.error("Networking error occurred:", error);
        movieGrid.innerHTML = '<div class="message">Failed to reach storage servers. Check network.</div>';
    }
}

/* ==========================================
   2. DOM Engine & Rendering Functions
   ========================================== */
function renderGrid(movies) {
    movieGrid.innerHTML = '';
    
    movies.forEach(movie => {
        // Evaluate if this specific node matches internal storage elements
        const isFavorited = favoriteMovies.some(fav => fav.imdbID === movie.imdbID);
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        
        // Use a safe placeholder graphic if external source poster returns empty
        const posterImg = movie.Poster !== 'N/A' ? movie.Poster : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop';
        
        card.innerHTML = `
            <div class="poster-wrapper">
                <img src="${posterImg}" alt="${movie.Title}" loading="lazy">
            </div>
            <div class="movie-info">
                <h3 title="${movie.Title}">${movie.Title}</h3>
                <p>${movie.Year} • ${movie.Type.toUpperCase()}</p>
                <button 
                    class="fav-btn ${isFavorited ? 'is-fav' : ''}" 
                    data-id="${movie.imdbID}"
                    data-title="${escapeHTML(movie.Title)}"
                    data-year="${movie.Year}"
                    data-poster="${posterImg}"
                    data-type="${movie.Type}">
                    ${isFavorited ? '❤️ Remove' : '⭐ Favorite'}
                </button>
            </div>
        `;
        movieGrid.appendChild(card);
    });

    // Event Delegation: Bind single click handler on cards layout row
    const buttons = movieGrid.querySelectorAll('.fav-btn');
    buttons.forEach(btn => btn.addEventListener('click', handleFavoriteToggle));
}

function displayFavoritesPage() {
    if (favoriteMovies.length === 0) {
        movieGrid.innerHTML = '<div class="message">Your vault is empty. Items you star appear here.</div>';
    } else {
        renderGrid(favoriteMovies);
    }
}

/* ==========================================
   3. Client-Side State & LocalStorage 
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
        // Found matching item inside storage: Remove it
        favoriteMovies.splice(targetIndex, 1);
        btn.classList.remove('is-fav');
        btn.innerHTML = '⭐ Favorite';
        
        // Dynamic cleanup optimization when running operations directly inside favorites tab
        if (currentView === 'favorites') {
            displayFavoritesPage();
        }
    } else {
        // New signature detected: Cache object locally
        favoriteMovies.push(currentMovie);
        btn.classList.add('is-fav');
        btn.innerHTML = '❤️ Remove';
    }

    // Update global variables inside runtime state environments
    localStorage.setItem('vaultFavorites', JSON.stringify(favoriteMovies));
    updateFavoriteBadge();
}

function updateFavoriteBadge() {
    favCountSpan.textContent = favoriteMovies.length;
}

// Security sanitation pattern to isolate special strings passing into layout attributes
function escapeHTML(str) {
    return str.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
}

/* ==========================================
   4. Application Controller Event Listeners
   ========================================== */
// Process queries via input keystrokes using a 400ms software debounce mechanism
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    
    // Switch views to visual panel context if active changes break flow sequence state
    if (currentView !== 'search') {
        switchToSearchView();
    }
    
    const value = e.target.value.trim();
    if (value.length > 2) {
        searchTimeout = setTimeout(() => {
            performSearch(value);
        }, 400);
    }
});

navSearchBtn.addEventListener('click', switchToSearchView);
navFavBtn.addEventListener('click', () => {
    currentView = 'favorites';
    navSearchBtn.classList.remove('active-tab');
    navFavBtn.classList.add('active-tab');
    viewTitle.textContent = "Your Favorites Vault";
    displayFavoritesPage();
});

function switchToSearchView() {
    currentView = 'search';
    navFavBtn.classList.remove('active-tab');
    navSearchBtn.classList.add('active-tab');
    viewTitle.textContent = "Trending & Searches";
    if(searchInput.value.trim().length > 2) {
        performSearch(searchInput.value.trim());
    } else {
        performSearch('Matrix'); // Standard dynamic layout view fallback
    }
}