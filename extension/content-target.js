// Runs on target domains (*.dichvupro.net, *.dichvupro.com)

function setNativeValue(element, value) {
  try {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } catch (e) {
    console.error("[Portal Extension] Fallback setNativeValue used", e);
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

let attempt = 0;
const maxAttempts = 20; // Try for up to 10 seconds
let retryInterval;

function autoFillAndLogin() {
  chrome.storage.local.get(['portal_autologin'], (result) => {
    const creds = result.portal_autologin;
    if (!creds) {
      clearInterval(retryInterval);
      return; // No credentials pending
    }

    const hostname = window.location.hostname;
    // We can iterate over configs or just use a generic approach, or fuzzy match
    let config = window.PORTAL_SITE_CONFIGS && window.PORTAL_SITE_CONFIGS[hostname];
    
    if (!config) {
      // Fallback fuzzy match for subdomains
      for (let key in window.PORTAL_SITE_CONFIGS) {
        if (hostname.includes(key)) {
          config = window.PORTAL_SITE_CONFIGS[key];
          break;
        }
      }
    }

    if (!config) {
      console.log("[Portal Extension] No configuration found for this domain:", hostname, ". Using fallback generic selectors.");
      config = {
        usernameSelector: "input[type='text'], input[type='email'], input[name='username'], input[name='email']",
        passwordSelector: "input[type='password'], input[name='password']",
        loginButtonSelector: "button[type='submit'], input[type='submit'], button"
      };
    }

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
      clearInterval(retryInterval); // Stop retrying once filled
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

// Try auto-fill using an interval to catch asynchronous React rendering
retryInterval = setInterval(() => {
  attempt++;
  if (attempt >= maxAttempts) {
    clearInterval(retryInterval);
    return;
  }
  autoFillAndLogin();
}, 500);
