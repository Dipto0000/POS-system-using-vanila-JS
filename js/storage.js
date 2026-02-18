export const getTheme = () => {
    return localStorage.getItem('theme') || 'light';
};

export const setTheme = (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
};

export const getUIState = () => {
    const state = localStorage.getItem('ui-state');
    return state ? JSON.parse(state) : { posOrder: ['selection', 'summary'] };
};

export const setUIState = (state) => {
    localStorage.setItem('ui-state', JSON.stringify(state));
};
