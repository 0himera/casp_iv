// Runs before first paint; keep the storage key in sync with ThemeProvider.
export const themeInitScript = `(function(){var t;try{t=localStorage.getItem('caspian-theme')}catch(e){}document.documentElement.dataset.theme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'})()`;
