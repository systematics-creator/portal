// Runs on Portal domain
window.addEventListener('message', (event) => {
  // Verify origin matches the current window origin (in case of different Vercel domains)
  if (event.origin !== window.location.origin) {
    return;
  }

  // Check if it's our auto-login message
  if (event.data && event.data.type === 'PORTAL_AUTO_LOGIN') {
    const credentials = event.data.data;
    console.log("[Portal Extension] Received credentials from Portal", credentials);
    
    // Store in extension local storage
    chrome.storage.local.set({ portal_autologin: credentials }, () => {
      console.log("[Portal Extension] Credentials saved to secure extension storage");
      alert("Extension đã nhận được tài khoản!");
    });
  }
});

console.log("[Portal Extension] Content script loaded on Portal");
