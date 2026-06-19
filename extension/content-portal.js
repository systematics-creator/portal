// Runs on Portal domain
window.addEventListener('message', (event) => {
  // Verify origin matches our portal domains
  if (event.origin !== 'https://portal-wine-omega-71.vercel.app' && event.origin !== 'http://localhost:3000') {
    return;
  }

  // Check if it's our auto-login message
  if (event.data && event.data.type === 'PORTAL_AUTO_LOGIN') {
    const credentials = event.data.data;
    console.log("[Portal Extension] Received credentials from Portal");
    
    // Store in extension local storage
    chrome.storage.local.set({ portal_autologin: credentials }, () => {
      console.log("[Portal Extension] Credentials saved to secure extension storage");
    });
  }
});

console.log("[Portal Extension] Content script loaded on Portal");
