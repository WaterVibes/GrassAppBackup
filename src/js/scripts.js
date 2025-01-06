// Initialize loading screen
const loadingScreen = document.querySelector('.loading-screen');
const loadingProgress = document.querySelector('.loading-progress');

// Update loading progress
function updateLoadingProgress(progress) {
    if (loadingProgress) {
        loadingProgress.style.width = `${progress}%`;
        if (progress === 100) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 500);
        }
    }
}

// District selection function
window.selectDistrict = function(district) {
    console.log('Selected district:', district);
};

// Info cards function
window.showInfoCards = function(type) {
    console.log('Showing info cards for:', type);
};

// Simulate initial loading
let progress = 0;
const loadingInterval = setInterval(() => {
    progress += 10;
    updateLoadingProgress(progress);
    if (progress >= 100) {
        clearInterval(loadingInterval);
    }
}, 200); 