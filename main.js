console.log("THIS IS THE CORRECT MAIN.JS");
import { SkinViewer } from "skinview3d";

// Create the SkinViewer instance
const viewer = new SkinViewer({
    canvas: document.getElementById("skinViewer"),
    width: 400,
    height: 600,
    skin: "./steve.png", // Default skin
});

viewer.controls.enableZoom = true;
viewer.controls.enableRotate = true;

let currentSkinBase64 = null; // Store the current skin in base64 format

// Function to overlay the selected clothing onto the skin
const overlayClothing = (clothingPath) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const skinImage = new Image();
    const clothingImage = new Image();

    canvas.width = 64;
    canvas.height = 64;

    return new Promise((resolve) => {
        skinImage.onload = () => {
            // Draw the full base skin
            ctx.drawImage(skinImage, 0, 0, 64, 64);


            clothingImage.onload = () => {
                // Overlay the selected clothing texture
                ctx.drawImage(clothingImage, 0, 0, 64, 64);

                // Convert the modified skin back to base64
                const modifiedSkinBase64 = canvas.toDataURL("image/png");
                resolve(modifiedSkinBase64);
            };
            clothingImage.onerror = () => {
                console.error("Clothing failed to load:", clothingPath);
                resolve(currentSkinBase64 || "./steve.png");
            };
            clothingImage.src = clothingPath;
        };

        skinImage.src = currentSkinBase64 || "./steve.png";

    });
};

// Function to update the 3D viewer with selected clothing
const updateSkin = async () => {
    const clothingPath = `/SolandWardrobe/textures/${document.getElementById("clothingSelect").value}.png`;


    try {
        // Apply the selected clothing overlay
        const modifiedSkin = await overlayClothing(clothingPath);

        // Load the modified skin into the viewer
        viewer.loadSkin(modifiedSkin);

        // Enable the download button
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

// Event listener for file upload
document.getElementById("upload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            currentSkinBase64 = event.target.result;
            updateSkin();
        };
        reader.readAsDataURL(file);
    }
});

// Event listener for username search
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

            // Use Crafatar to get the skin
            const skinUrl = `https://crafatar.com/skins/${uuid}`;
            const skinResponse = await fetch(skinUrl);
            const blob = await skinResponse.blob();

            const reader = new FileReader();
            reader.onload = (event) => {
                currentSkinBase64 = event.target.result;
                updateSkin();
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            alert("An error occurred while fetching the skin.");
        }
    }
});

// Event listener for clothing selection
document.getElementById("clothingSelect").addEventListener("change", updateSkin);