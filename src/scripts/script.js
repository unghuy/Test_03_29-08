// Get the video element
const video = document.getElementById("bannerVideo");

// Get the toggle button
const videoBtn = document.getElementById("videoBtn");

// Function to toggle play and pause
function togglePlayPause() {
  if (video.paused) {
    video.play();
    videoBtn.innerHTML = '<i class="fa-solid fa-play"></i>'; // Update button text to "Pause"
  } else {
    video.pause();
    videoBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'; // Update button text to "Play"
  }
}

// Add event listener to the button to toggle play/pause on click
videoBtn.addEventListener("click", togglePlayPause);
