// HugATree Public Website
// Handles fetching tree data from the API and rendering it
// on the public page when a QR code is scanned

// Base URL for the HugATree API hosted on Render
const API_BASE_URL = "https://hugatree.onrender.com";

// Extracts the tree ID from the current page URL
// Supports query string format (?id=1) and path format (/trees/1)
function getTreeIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    // Check query string first as this is the format used by QR codes
    if (id && /^\d+$/.test(id)) return id;

    // fallback to path (for future production URLs like /trees/1)
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const maybeId = pathParts[pathParts.length - 1];
    return maybeId && /^\d+$/.test(maybeId) ? maybeId : null;
}

// Sets text content of an HTML element by ID
// Displays fallback text if the value is null or undefined
function setText(id, value, fallback = "Not available") {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value ?? fallback;
}

// Formats a date string into UK format (e.g. "15 Mar 2026, 21:03")
// Returns the original value if it cannot be parsed
function formatDate(value) {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

// Appends a suffix to a value (e.g. "10" becomes "10 m")
// Returns "Not available" if the value is empty or null
function formatNullable(value, suffix = "") {
    if (value === null || value === undefined || value === "") return "Not available";
    return `${value}${suffix}`;
}

// Initialises a Leaflet map and places a marker at the tree location
function renderMap(lat, lng, treeName) {
    const map = L.map("map").setView([lat, lng], 16);

    // OpenStreetMap tile layer for base map imagery
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Marker with popup showing tree species name
    L.marker([lat, lng]).addTo(map).bindPopup(treeName);

    // 🔥 Fix
    setTimeout(() => {
        map.invalidateSize();
    }, 0);
}

// Populates all page elements with data from the API response
// Receives tree info, latest measurements, and photo data
function renderTree(data) {
    const tree = data.tree || {};
    const latestHistory = data.latestHistory || {};
    const treeName = tree.speciesCommonName || "Unknown tree";

    // Hero section and page heading
    setText("treeName", treeName);
    setText("scientificName", "Scientific name not returned by API");
    setText("treeHeading", treeName);
    setText("treeSubtitle", tree.addressText || "Public tree information");
    setText("treeId", tree.id);

    // Fact cards for species and physical measurements
    setText("factSpecies", tree.speciesCommonName);
    setText("factAge", formatNullable(latestHistory.probableAgeYears, " years"));
    setText("factHeight", formatNullable(latestHistory.heightM, " m"));
    setText("factDiameter", formatNullable(latestHistory.trunkDiameterCm, " cm"));
    setText("factCanopy", formatNullable(latestHistory.canopyDiameterM, " m"));
    setText("factDensity", latestHistory.canopyDensity);

    // Environmental impact data
    setText("factCo2Sequestered", formatNullable(latestHistory.estimatedCo2SequesteredYearKg, " kg"));
    setText("factWaterUse", formatNullable(latestHistory.estimatedWaterUseYearL, " L"));

    // Sidebar metadata
    setText("detailPlantedAt", tree.plantedAt || "Unknown");
    setText("detailPlantedBy", tree.plantedBy || "Unknown");
    setText("detailAddress", tree.addressText || "Unknown");
    setText("detailAdoptedBy", tree.adoptedBy || "Nobody yet");
    setText("detailRecordedAt", formatDate(latestHistory.recordedAt));
    setText("detailRecordedBy", latestHistory.recordedByName || "Unknown");

    // Measurement method labels
    setText("detailAgeBasis", latestHistory.ageBasis || "Unknown");
    setText("detailHeightMethod", latestHistory.heightMethod || "Unknown");
    setText("detailDiameterMethod", latestHistory.diameterMethod || "Unknown");

    // GPS coordinates and measurement snapshot
    setText("latLngText", `${tree.lat}, ${tree.lng}`);
    setText("snapshotObservationId", latestHistory.observationId || "None");
    setText("snapshotDiameterHeight", formatNullable(latestHistory.diameterHeightCm, " cm"));
    setText(
        "snapshotText",
        `Latest history was recorded by ${latestHistory.recordedByName || "unknown"} on ${formatDate(latestHistory.recordedAt)}.`
    );

    // Show map if coordinates are present
    if (typeof tree.lat === "number" && typeof tree.lng === "number") {
        renderMap(tree.lat, tree.lng, treeName);
    }

    // Render photo gallery
    renderPhotos(data.photos || []);
}

// Renders the photo gallery section
// Filters for approved photos only
// First approved photo is set as the hero background image
// Remaining photos display in a responsive grid
function renderPhotos(photos = []) {
    const approvedPhotos = photos.filter(photo => photo.approval_status === "approved");
    const heroPhoto = document.getElementById("heroPhoto");
    const photoGallery = document.getElementById("photoGallery");

    if (!heroPhoto || !photoGallery) return;

    // Display placeholder if no approved photos exist
    if (approvedPhotos.length === 0) {
        photoGallery.innerHTML = `
            <div class="col-12">
                <p class="text-muted mb-0">No approved photos available yet.</p>
            </div>
        `;
        return;
    }

    // Set first approved photo as hero background
    const firstPhotoUrl = `${API_BASE_URL}/${approvedPhotos[0].storage_key}`;

    heroPhoto.style.backgroundImage = `url("${firstPhotoUrl}")`;
    heroPhoto.classList.add("has-image");

    const remainingPhotos = approvedPhotos.slice(1);

    // Handle case where only one photo exists
    if (remainingPhotos.length === 0) {
        photoGallery.innerHTML = `
            <div class="col-12">
                <p class="text-muted mb-0">Only one approved photo is available, shown above.</p>
            </div>
        `;
        return;
    }

    // Generate gallery grid with responsive columns
    photoGallery.innerHTML = remainingPhotos.map(photo => {
        const photoUrl = `${API_BASE_URL}/${photo.storage_key}`;

        return `
            <div class="col-6 col-md-3">
                <div class="gallery-tile border rounded-4 overflow-hidden">
                    <img 
                        src="${photoUrl}" 
                        alt="${photo.observation_title || "Tree photo"}"
                        class="gallery-photo"
                    />
                </div>
            </div>
        `;
    }).join("");
}

// Main entry point - fetches tree data from the API
// Manages loading, success, and error states on the page
async function loadTree() {
    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const treeContent = document.getElementById("treeContent");

    const treeId = getTreeIdFromUrl();

    // Show error if no valid tree ID is found in the URL
    if (!treeId) {
        loadingState.classList.add("d-none");
        errorState.classList.remove("d-none");
        errorState.textContent = "No valid tree id was found in the URL.";
        return;
    }

    try {
        // Fetch tree data from the API by ID
        const response = await fetch(`${API_BASE_URL}/trees/${treeId}`);

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched tree data:", data);
        renderTree(data);

        // Hide loading indicator and display tree content
        loadingState.classList.add("d-none");
        treeContent.classList.remove("d-none");
    } catch (error) {
        // Display error message if the request fails
        loadingState.classList.add("d-none");
        errorState.classList.remove("d-none");
        errorState.textContent = error.message || "Failed to load tree details.";
    }
}

// Load tree data on page open
loadTree();

// Initialise Bootstrap popovers for CO2 and water use info buttons
document.addEventListener("DOMContentLoaded", function () {
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    popoverTriggerList.forEach(el => new bootstrap.Popover(el));
  });
