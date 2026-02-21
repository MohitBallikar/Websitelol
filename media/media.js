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

    // ---------------------------------------------------------
    // LETTERBOXD INTEGRATION
    // ---------------------------------------------------------
    const LB_WORKER_URL = "https://letterboxd-proxy.mohitballikar.workers.dev"; // Placeholder URL
    const lbGridContainer = document.getElementById('letterboxd-grid');
    const lbLoadingSpinner = document.getElementById('lb-loading-spinner');
    const lbErrorMessage = document.getElementById('lb-error-message');

    async function fetchLetterboxd() {
        try {
            const response = await fetch(`${LB_WORKER_URL}?user=moistmelvin`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rawXml = await response.text();

            // Parse the XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(rawXml, "text/xml");
            const items = xmlDoc.querySelectorAll("item");

            if (!items || items.length === 0) {
                lbErrorMessage.textContent = "NO RECENT DATA FOUND IN MAGI ARCHIVES.";
                lbErrorMessage.style.display = 'block';
                lbLoadingSpinner.style.display = 'none';
                return;
            }

            renderLetterboxdGrid(items);

        } catch (error) {
            console.error("Error fetching Letterboxd data:", error);
            lbErrorMessage.style.display = 'block';
            lbLoadingSpinner.style.display = 'none';
        }
    }

    function renderLetterboxdGrid(items) {
        lbGridContainer.innerHTML = '';

        // Only grab the first 10 for a clean 2 rows
        const recentFilms = Array.from(items).slice(0, 10);

        recentFilms.forEach(item => {
            const titleElement = item.querySelector("title");
            const titleText = titleElement ? titleElement.textContent : "Unknown Film";

            const linkElement = item.querySelector("link");
            const filmUrl = linkElement ? linkElement.textContent : "#";

            const descElement = item.querySelector("description");
            const descHtml = descElement ? descElement.textContent : "";

            // Extract the image from the CDATA HTML description using Regex
            const imgRegex = /img src="([^"]+)"/;
            const match = descHtml.match(imgRegex);
            const imageUrl = match ? match[1] : '../static/placeholder.jpg';

            // Letterboxd RSS includes the year and rating in the title like "Movie Name, 2024 - ★★★★"
            // Let's parse that out for a cleaner display
            let cleanTitle = titleText;
            let rating = "";
            let year = "";

            if (titleText.includes(" - ")) {
                const parts = titleText.split(" - ");
                rating = parts[parts.length - 1]; // The stars

                // Now split the first part to get the year if it exists
                const titleAndYear = parts.slice(0, -1).join(" - ");
                const commaIndex = titleAndYear.lastIndexOf(", ");

                if (commaIndex !== -1) {
                    cleanTitle = titleAndYear.substring(0, commaIndex);
                    year = titleAndYear.substring(commaIndex + 2);
                } else {
                    cleanTitle = titleAndYear;
                }
            } else {
                // If no rating, look for the year
                const commaIndex = titleText.lastIndexOf(", ");
                if (commaIndex !== -1) {
                    cleanTitle = titleText.substring(0, commaIndex);
                    year = titleText.substring(commaIndex + 2);
                }
            }

            const card = document.createElement('a');
            card.href = filmUrl;
            card.target = "_blank";
            card.rel = "noopener noreferrer";
            card.className = 'media-card letterboxd-card';

            card.innerHTML = `
              <div class="media-image-container movie">
                <img src="${imageUrl}" alt="${cleanTitle}" class="media-image" loading="lazy">
                ${rating ? `
                <div class="media-overlay">
                    <div class="media-playcount letterboxd-rating">${rating}</div>
                </div>` : ''}
              </div>
              <div class="media-info">
                <div class="media-title" title="${cleanTitle}">${cleanTitle}</div>
                <div class="media-artist" title="${year}">${year}</div>
              </div>
            `;

            lbGridContainer.appendChild(card);
        });

        // Hide loading, show grid
        lbLoadingSpinner.style.display = 'none';
        lbGridContainer.style.display = 'grid';

        // Animate them in sequentially
        setTimeout(() => {
            document.querySelectorAll('.letterboxd-card').forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('visible');
                }, index * 50); // Staggered fade in
            });
        }, 100);
    }

    // Call fetch for Letterboxd as well
    fetchLetterboxd();
});
