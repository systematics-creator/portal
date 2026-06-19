// Runs on target domains (*.dichvupro.net, *.dichvupro.com)

function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
  
  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    valueSetter.call(element, value);
  }
  
  // Trigger events for React/Vue
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function autoFillAndLogin() {
  chrome.storage.local.get(['portal_autologin'], (result) => {
    const creds = result.portal_autologin;
    if (!creds) return; // No credentials pending

    const hostname = window.location.hostname;
    const config = window.PORTAL_SITE_CONFIGS && window.PORTAL_SITE_CONFIGS[hostname];
    
    if (!config) {
      console.log("[Portal Extension] No configuration found for this domain:", hostname);
      return;
    }

    // Check if we are on the correct website as intended
    try {
      const targetUrl = new URL(creds.website);
      if (hostname !== targetUrl.hostname) {
        return; // Credentials don't belong to this host
      }
    } catch (e) {
      console.error("[Portal Extension] Invalid credential website URL");
      return;
    }

    console.log("[Portal Extension] Initiating auto-fill for", hostname);

    let filled = false;

    // Fill Store Code if selector exists
    if (config.storeSelector && creds.store_code) {
      const storeInput = document.querySelector(config.storeSelector);
      if (storeInput) {
        setNativeValue(storeInput, creds.store_code);
        filled = true;
      }
    }

    // Fill Username if selector exists
    if (config.usernameSelector && creds.username) {
      const usernameInput = document.querySelector(config.usernameSelector);
      if (usernameInput) {
        setNativeValue(usernameInput, creds.username);
        filled = true;
      }
    }

    // Fill Password if selector exists
    if (config.passwordSelector && creds.password) {
      const passwordInput = document.querySelector(config.passwordSelector);
      if (passwordInput) {
        setNativeValue(passwordInput, creds.password);
        filled = true;
      }
    }

    if (filled && config.loginButtonSelector) {
      setTimeout(() => {
        const loginBtn = document.querySelector(config.loginButtonSelector);
        if (loginBtn) {
          console.log("[Portal Extension] Clicking login button");
          loginBtn.click();
          
          // Clear credentials after successful trigger
          chrome.storage.local.remove('portal_autologin');
        }
      }, 500);
    }
  });
}

// Try auto-fill when DOM is ready, and also after a short delay in case of SPAs
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(autoFillAndLogin, 500); // Wait for React to render
  });
} else {
  setTimeout(autoFillAndLogin, 500);
}

// Additional backup for slow rendering SPAs
setTimeout(autoFillAndLogin, 2000);
