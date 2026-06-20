// content-target.js

function setNativeValue(element, value) {
  try {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = prototype ? Object.getOwnPropertyDescriptor(prototype, 'value')?.set : undefined;
    
    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }
    
    element.dispatchEvent(new Event('input', { bubbles: true }));
    // Removed 'change' event to match the flawless old extension behavior
  } catch (e) {
    console.error("setNativeValue error", e);
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function processPayload(payload) {
  const action = payload.action;
  const selectors = payload.selectors;
  
  let attempts = 0;
  const maxAttempts = 15; // Try for 7.5 seconds (15 * 500ms)

  const checkInterval = setInterval(() => {
    attempts++;
    
    const usernameEl = selectors.username ? document.querySelector(selectors.username) : null;
    const passwordEl = selectors.password ? document.querySelector(selectors.password) : null;
    
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

        if (selectors.store && creds.storeCode) {
          const storeInput = document.querySelector(selectors.store);
          if (storeInput) setNativeValue(storeInput, creds.storeCode);
        }

        if (usernameEl && creds.username) {
          setNativeValue(usernameEl, creds.username);
        }

        if (passwordEl && creds.password) {
          setNativeValue(passwordEl, creds.password);
        }

        if (payload.autoSubmit && selectors.login) {
          setTimeout(() => {
            const btn = document.querySelector(selectors.login);
            if (btn) {
              btn.click();
            }
          }, 800);
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
