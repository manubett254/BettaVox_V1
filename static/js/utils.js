export function showElement(el) {
    el?.classList?.remove("hidden");
}

export function hideElement(el) {
    el?.classList?.add("hidden");
}


// utils.js (additional functionality)
export function initToastSystem() {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
}

export function showError(msg, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast-error';
    toast.textContent = msg;
    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

if (!window.helpers) {
    console.error("Helpers not initialized!");
    // Optionally initialize defaults or show error
}