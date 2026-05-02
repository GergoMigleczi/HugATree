const API_BASE_URL = "https://hugatree.onrender.com";

function getTreeIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (id && /^\d+$/.test(id)) return id;

    // fallback to path (for future production URLs like /trees/1)
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const maybeId = pathParts[pathParts.length - 1];
    return maybeId && /^\d+$/.test(maybeId) ? maybeId : null;
}

function setText(id, value, fallback = "Not available") {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value ?? fallback;
}

function formatDate(value) {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatNullable(value, suffix = "") {
    if (value === null || value === undefined || value === "") return "Not available";
    return `${value}${suffix}`;
}

function renderMap(lat, lng, treeName) {
    const map = L.map("map").setView([lat, lng], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.marker([lat, lng]).addTo(map).bindPopup(treeName);

    // 🔥 Fix
    setTimeout(() => {
        map.invalidateSize();
    }, 0);
}

function renderTree(data) {
    const tree = data.tree || {};
    const latestHistory = data.latestHistory || {};
    const treeName = tree.speciesCommonName || "Unknown tree";

    setText("treeName", treeName);
    setText("scientificName", "Scientific name not returned by API");
    setText("treeHeading", treeName);
    setText("treeSubtitle", tree.addressText || "Public tree information");
    setText("treeId", tree.id);

    setText("factSpecies", tree.speciesCommonName);
    setText("factAge", formatNullable(latestHistory.probableAgeYears, " years"));
    setText("factHeight", formatNullable(latestHistory.heightM, " m"));
    setText("factDiameter", formatNullable(latestHistory.trunkDiameterCm, " cm"));
    setText("factCanopy", formatNullable(latestHistory.canopyDiameterM, " m"));
    setText("factDensity", latestHistory.canopyDensity);
    setText("factCo2Sequestered", formatNullable(latestHistory.estimatedCo2SequesteredYearKg, " kg"));
    setText("factWaterUse", formatNullable(latestHistory.estimatedWaterUseYearL, " L"));


    setText("detailPlantedAt", tree.plantedAt || "Unknown");
    setText("detailPlantedBy", tree.plantedBy || "Unknown");
    setText("detailAddress", tree.addressText || "Unknown");
    setText("detailAdoptedBy", tree.adoptedBy || "Nobody yet");
    setText("detailRecordedAt", formatDate(latestHistory.recordedAt));
    setText("detailRecordedBy", latestHistory.recordedByName || "Unknown");
    setText("detailAgeBasis", latestHistory.ageBasis || "Unknown");
    setText("detailHeightMethod", latestHistory.heightMethod || "Unknown");
    setText("detailDiameterMethod", latestHistory.diameterMethod || "Unknown");

    setText("latLngText", `${tree.lat}, ${tree.lng}`);
    setText("snapshotObservationId", latestHistory.observationId || "None");
    setText("snapshotDiameterHeight", formatNullable(latestHistory.diameterHeightCm, " cm"));
    setText(
        "snapshotText",
        `Latest history was recorded by ${latestHistory.recordedByName || "unknown"} on ${formatDate(latestHistory.recordedAt)}.`
    );

    if (typeof tree.lat === "number" && typeof tree.lng === "number") {
        renderMap(tree.lat, tree.lng, treeName);
    }

    renderPhotos(data.photos || []);
}

function renderPhotos(photos = []) {
    const approvedPhotos = photos.filter(photo => photo.approval_status === "approved");
    const heroPhoto = document.getElementById("heroPhoto");
    const photoGallery = document.getElementById("photoGallery");

    if (!heroPhoto || !photoGallery) return;

    if (approvedPhotos.length === 0) {
        photoGallery.innerHTML = `
            <div class="col-12">
                <p class="text-muted mb-0">No approved photos available yet.</p>
            </div>
        `;
        return;
    }

    const firstPhotoUrl = `${API_BASE_URL}/${approvedPhotos[0].storage_key}`;

    heroPhoto.style.backgroundImage = `url("${firstPhotoUrl}")`;
    heroPhoto.classList.add("has-image");

    const remainingPhotos = approvedPhotos.slice(1);

    if (remainingPhotos.length === 0) {
        photoGallery.innerHTML = `
            <div class="col-12">
                <p class="text-muted mb-0">Only one approved photo is available, shown above.</p>
            </div>
        `;
        return;
    }

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

async function loadTree() {
    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const treeContent = document.getElementById("treeContent");

    const treeId = getTreeIdFromUrl();

    if (!treeId) {
        loadingState.classList.add("d-none");
        errorState.classList.remove("d-none");
        errorState.textContent = "No valid tree id was found in the URL.";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/trees/${treeId}`);

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched tree data:", data);
        renderTree(data);

        loadingState.classList.add("d-none");
        treeContent.classList.remove("d-none");
    } catch (error) {
        loadingState.classList.add("d-none");
        errorState.classList.remove("d-none");
        errorState.textContent = error.message || "Failed to load tree details.";
    }
}

loadTree();

document.addEventListener("DOMContentLoaded", function () {
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    popoverTriggerList.forEach(el => new bootstrap.Popover(el));
  });