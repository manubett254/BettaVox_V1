// dark.js - Theme management module
export const initTheme = () => {
    const themeToggleBtn = document.querySelector('.theme-icon');
    if (!themeToggleBtn) return; // Exit if no theme button found
    
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Apply the current theme
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggleBtn.textContent = '🌞';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeToggleBtn.textContent = '🌓';
        }
    };
    
    // Get current theme from storage or system preference
    const getCurrentTheme = () => {
        return localStorage.getItem('theme') || 
               (prefersDarkScheme.matches ? 'dark' : 'light');
    };
    
    // Initialize theme
    const currentTheme = getCurrentTheme();
    applyTheme(currentTheme);
    
    // Toggle theme on button click
    themeToggleBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.hasAttribute('data-theme') ? 
                         'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
    
    // Watch for system theme changes (only if no preference set)
    prefersDarkScheme.addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
    
    // Return functions for external use if needed
    return {
        getCurrentTheme,
        applyTheme
    };
};