// Clothing → model type mapping
// Hari = Steve (default), Sahui = Alex (slim)
const clothingModelMap = {
    "hari": "default",
    "sahui": "slim"
};

let originalSkinBase64 = null;
let currentSkinBase64 = null;
let modelType = "default"; // "default" = Steve, "slim" = Alex

console.log("THIS IS THE CORRECT MAIN.JS");

import { SkinViewer } from "skinview3d";

// We MUST use let so we can recreate the viewer
let viewer = new SkinViewer({
    canvas: document.getElementById("skinViewer"),
    width: 400,
    height: 600,
    skin: "/SolanduWardrobe/textures/steve.png",
    model: "default"
});

viewer.controls.enableZoom = true;
viewer.controls.enableRotate = true;

// Helper to recreate viewer so model changes actually apply
const recreateViewer = (skin, model) => {
    const canvas = document.getElementById("skinViewer");

    if (viewer && typeof viewer.dispose === "function") {
        viewer.dispose();
    }

    viewer = new SkinViewer({
        canvas,
        width: 400,
        height: 600,
        skin,
        model
    });

    viewer.controls.enableZoom = true;
    viewer.controls.enableRotate = true;
};

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

            const pixel = ctx.getImageData(54, 20, 1, 1).data;

            if (pixel[3] === 0) {
                resolve("slim");
            } else {
                resolve("default");
            }
        };
        img.src = base64;
    });
}

// Overlay clothing onto the ORIGINAL skin
const overlayClothing = (clothingPath) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const skinImage = new Image();
    const clothingImage = new Image();

    canvas.width = 64;
    canvas.height = 64;

    return new Promise((resolve) => {
        skinImage.onload = () => {
            ctx.drawImage(skinImage, 0, 0, 64, 64);

            clothingImage.onload = () => {
                ctx.drawImage(clothingImage, 0, 0, 64, 64);
                resolve(canvas.toDataURL("image/png"));
            };

            clothingImage.onerror = () => {
                console.error("Clothing failed to load:", clothingPath);
                resolve(originalSkinBase64);
            };

            clothingImage.src = `${clothingPath}?v=${Date.now()}`;
        };

        skinImage.src = originalSkinBase64;
    });
};

// Update viewer with selected clothing
const updateSkin = async () => {
    const select = document.getElementById("clothingSelect");
    const value = select.value;
    const clothingPath = `/SolanduWardrobe/textures/${value}.png`;

    console.log("Selected value:", value);
    console.log("Clothing path:", clothingPath);

    try {
        const modifiedSkin = await overlayClothing(clothingPath);

        // Clothing determines model
        const clothingModel = clothingModelMap[value] || modelType;

        // Recreate viewer so geometry actually changes
        recreateViewer(modifiedSkin, clothingModel);

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
            console.log("Detected model:", modelType);

            recreateViewer(currentSkinBase64, modelType);

            updateSkin();
        };
        reader.readAsDataURL(file);
    }
});

// Clothing selection
document.getElementById("clothingSelect").addEventListener("change", updateSkin);

// Load Steve on startup
originalSkinBase64 = "/SolanduWardrobe/textures/steve.png";
currentSkinBase64 = originalSkinBase64;

recreateViewer("/SolanduWardrobe/textures/steve.png", "default");
