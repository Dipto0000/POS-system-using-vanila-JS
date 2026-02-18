import { getTheme, setTheme } from './storage.js';
import { initPOS } from './pos.js';
import { initProducts } from './products.js';
import { initSales } from './sales.js';

const appContent = document.getElementById('app-content');
const viewTitle = document.getElementById('view-title');
const themeToggle = document.getElementById('theme-toggle');
const navItems = document.querySelectorAll('.nav-item');

// Initialize Theme
const currentTheme = getTheme();
setTheme(currentTheme);
themeToggle.textContent = currentTheme === 'light' ? 'Dark Mode' : 'Light Mode';

themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    themeToggle.textContent = newTheme === 'light' ? 'Dark Mode' : 'Light Mode';
});

// Navigation Handling
const switchView = async (view) => {
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    appContent.innerHTML = '<div class="loading">Loading...</div>';

    switch (view) {
        case 'pos':
            viewTitle.textContent = 'New Sale';
            await initPOS(appContent);
            break;
        case 'products':
            viewTitle.textContent = 'Product List';
            await initProducts(appContent);
            break;
        case 'sales':
            viewTitle.textContent = 'Purchase List';
            await initSales(appContent);
            break;
    }
};

navItems.forEach(item => {
    item.addEventListener('click', () => switchView(item.dataset.view));
});

// Initial View
switchView('pos');
