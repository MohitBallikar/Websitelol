document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('lastfm-grid');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');

    // Define the URL for your Cloudflare Worker endpoint
    // NOTE: Change this to your actual deployed worker URL once you set it up on Cloudflare!
    // Example: "https://lastfm-proxy.your-username.workers.dev" or your custom domain route
    const WORKER_URL = "https://lastfm-proxy.mohitballikar.workers.dev"; // Placeholder URL

    async function fetchTopAlbums() {
        try {
            // We're expecting the worker to default to your username and a limit of 25.
            // We add it to the URL query string just in case.
            const response = await fetch(`${WORKER_URL}?user=moistmelvin&limit=25`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const albums = data.topalbums?.album;

            if (!albums || albums.length === 0) {
                errorMessage.textContent = "NO RECENT DATA FOUND IN MAGI ARCHIVES.";
                errorMessage.style.display = 'block';
                loadingSpinner.style.display = 'none';
                return;
            }

            renderGrid(albums);

        } catch (error) {
            console.error("Error fetching Last.fm data:", error);
            errorMessage.style.display = 'block';
            loadingSpinner.style.display = 'none';
        }
    }

    function renderGrid(albums) {
        gridContainer.innerHTML = '';

        albums.forEach(album => {
            // Last.fm returns an array of image sizes. Index 3 is usually 'extralarge' (300x300px)
            const imageUrl = album.image[3]['#text'] || '../static/placeholder.jpg';
            const playCount = album.playcount;
            const albumName = album.name;
            const artistName = album.artist.name;
            const albumUrl = album.url;

            // Create the card element
            const card = document.createElement('a');
            card.href = albumUrl;
            card.target = "_blank";
            card.rel = "noopener noreferrer";
            card.className = 'media-card';

            card.innerHTML = `
          <div class="media-image-container">
            <img src="${imageUrl}" alt="${albumName} by ${artistName}" class="media-image" loading="lazy">
            <div class="media-overlay">
                <div class="media-playcount">${playCount} PLAYS</div>
            </div>
          </div>
          <div class="media-info">
            <div class="media-title" title="${albumName}">${albumName}</div>
            <div class="media-artist" title="${artistName}">${artistName}</div>
          </div>
        `;

            gridContainer.appendChild(card);
        });

        // Hide loading, show grid
        loadingSpinner.style.display = 'none';
        gridContainer.style.display = 'grid';

        // Animate them in sequentially
        setTimeout(() => {
            document.querySelectorAll('.media-card').forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('visible');
                }, index * 50); // Staggered fade in
            });
        }, 100);
    }

    // Start the fetch when page loads
    fetchTopAlbums();
});
