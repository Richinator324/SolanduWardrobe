let originalSkinBase64 = null;
let currentSkinBase64 = null;
let modelType = "default"; // "default" = Steve, "slim" = Alex

console.log("THIS IS THE CORRECT MAIN.JS");

import { SkinViewer } from "skinview3d";

// Create the SkinViewer instance
const viewer = new SkinViewer({
    canvas: document.getElementById("skinViewer"),
    width: 400,
    height: 600,
    skin: "/SolanduWardrobe/textures/steve.png",
});

// Enable controls
viewer.controls.enableZoom = true;
viewer.controls.enableRotate = true;

// Detect whether a skin is Steve or Alex
function detectModelType(base64) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Pixel (54, 20) determines model type
            const pixel = ctx.getImageData(54, 20, 1, 1).data;

            // Transparent pixel → Alex
            if (pixel[3] === 0) {
                resolve("slim");
            } else {
                resolve("default");
            }
        };
        img.src = base64;
    });
}

// Overlay clothing onto the ORIGINAL skin (never the modified one)
const overlayClothing = (clothingPath) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const skinImage = new Image();
    const clothingImage = new Image();

    canvas.width = 64;
    canvas.height = 64;

    return new Promise((resolve) => {
        skinImage.onload = () => {
            // Draw the base skin
            ctx.drawImage(skinImage, 0, 0, 64, 64);

            clothingImage.onload = () => {
                ctx.drawImage(clothingImage, 0, 0, 64, 64);

                const modifiedSkinBase64 = canvas.toDataURL("image/png");
                resolve(modifiedSkinBase64);
            };

            clothingImage.onerror = () => {
                console.error("Clothing failed to load:", clothingPath);
                resolve(originalSkinBase64 || "/SolanduWardrobe/textures/steve.png");
            };

            // Cache-busting to force reload
            clothingImage.src = `${clothingPath}?v=${Date.now()}`;
        };

        // Always use ORIGINAL skin, not modified
        skinImage.src = originalSkinBase64 || "/SolanduWardrobe/textures/steve.png";
    });
};

// Update viewer with selected clothing
const updateSkin = async () => {
    const clothingPath = `/SolanduWardrobe/textures/${document.getElementById("clothingSelect").value}.png`;

    try {
        const modifiedSkin = await overlayClothing(clothingPath);

        viewer.loadSkin(modifiedSkin, { model: modelType });

        const downloadButton = document.getElementById("downloadButton");
        downloadButton.style.display = "block";
        downloadButton.onclick = () => {
            const link = document.createElement("a");
            link.href = modifiedSkin;
            link.download = "modified_skin.png";
            link.click();
        };
    } catch (error) {
        console.error("Error updating skin:", error);
        alert("Failed to load or apply the selected clothing.");
    }
};

// Handle file upload
document.getElementById("upload").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            currentSkinBase64 = event.target.result;
            originalSkinBase64 = currentSkinBase64;

            modelType = await detectModelType(currentSkinBase64);

            viewer.loadSkin(currentSkinBase64, { model: modelType });

            updateSkin();
        };
        reader.readAsDataURL(file);
    }
});

// Handle username search
document.getElementById("searchButton").addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    if (username) {
        try {
            const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${username}`);
            if (!response.ok) {
                alert("Username not found!");
                return;
            }
            const data = await response.json();
            const uuid = data.uuid;

            const skinUrl = `https://crafatar.com/skins/${uuid}`;
            const skinResponse = await fetch(skinUrl);
            const blob = await skinResponse.blob();

            const reader = new FileReader();
            reader.onload = async (event) => {
                currentSkinBase64 = event.target.result;
                originalSkinBase64 = currentSkinBase64;

                modelType = await detectModelType(currentSkinBase64);

                viewer.loadSkin(currentSkinBase64, { model: modelType });

                updateSkin();
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            alert("An error occurred while fetching the skin.");
        }
    }
});

// Clothing selection
document.getElementById("clothingSelect").addEventListener("change", updateSkin);

// Load Steve on startup
originalSkinBase64 = "/SolandWardrobe/textures/steve.png";
currentSkinBase64 = originalSkinBase64;
viewer.loadSkin("/SolanduWardrobe/textures/steve.png", { model: "default" });
