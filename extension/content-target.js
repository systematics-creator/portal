// content-target.js

// Function to simulate React onChange events
function setNativeValue(element, value) {
  if (!element) return;
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
  
  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    valueSetter.call(element, value);
  }
  
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function processPayload(payload) {
  const action = payload.action; // "LOGIN" or "TEST"
  const selectors = payload.selectors;
  
  let attempts = 0;
  const maxAttempts = 10; // Try for 5 seconds (10 * 500ms)

  const checkInterval = setInterval(() => {
    attempts++;
    
    // Check if key elements exist
    const usernameEl = selectors.username ? document.querySelector(selectors.username) : null;
    const passwordEl = selectors.password ? document.querySelector(selectors.password) : null;
    
    // If we found the primary inputs OR we ran out of attempts
    if ((usernameEl && passwordEl) || attempts >= maxAttempts) {
      clearInterval(checkInterval);
      
      if (action === "TEST") {
        const result = {
          store: selectors.store ? !!document.querySelector(selectors.store) : false,
          username: !!usernameEl,
          password: !!passwordEl,
          login: selectors.login ? !!document.querySelector(selectors.login) : false
        };

        chrome.storage.local.set({
          portal_test_result: {
            configId: payload.configId,
            result: result
          }
        }, () => {
          chrome.storage.local.remove(['portal_autologin']);
        });
        return;
      }

      if (action === "LOGIN") {
        const creds = payload.credentials;

        // Fill Store Code
        if (selectors.store && creds.storeCode) {
          const storeInput = document.querySelector(selectors.store);
          if (storeInput) setNativeValue(storeInput, creds.storeCode);
        }

        // Fill Username
        if (usernameEl && creds.username) {
          setNativeValue(usernameEl, creds.username);
        }

        // Fill Password
        if (passwordEl && creds.password) {
          setNativeValue(passwordEl, creds.password);
        }

        // Click Login Button
        if (payload.autoSubmit && selectors.login) {
          setTimeout(() => {
            const btn = document.querySelector(selectors.login);
            if (btn) {
              btn.click();
            }
          }, 500);
        }

        chrome.storage.local.remove(['portal_autologin']);
      }
    }
  }, 500);
}

chrome.storage.local.get(['portal_autologin'], function(result) {
  if (result.portal_autologin) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        processPayload(result.portal_autologin);
      });
    } else {
      processPayload(result.portal_autologin);
    }
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.portal_autologin) {
    if (changes.portal_autologin.newValue) {
      processPayload(changes.portal_autologin.newValue);
    }
  }
});
