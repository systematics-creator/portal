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

  if (action === "TEST") {
    const result = {
      store: !!document.querySelector(selectors.store),
      username: !!document.querySelector(selectors.username),
      password: !!document.querySelector(selectors.password),
      login: !!document.querySelector(selectors.login)
    };

    chrome.storage.local.set({
      portal_test_result: {
        configId: payload.configId,
        result: result
      }
    }, () => {
      // Clear the test payload
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
    if (selectors.username && creds.username) {
      const usernameInput = document.querySelector(selectors.username);
      if (usernameInput) setNativeValue(usernameInput, creds.username);
    }

    // Fill Password
    if (selectors.password && creds.password) {
      const passwordInput = document.querySelector(selectors.password);
      if (passwordInput) setNativeValue(passwordInput, creds.password);
    }

    // Click Login Button
    if (payload.autoSubmit && selectors.login) {
      // Wait a tiny bit for React state to sync after input events
      setTimeout(() => {
        const btn = document.querySelector(selectors.login);
        if (btn) {
          btn.click();
        }
      }, 300);
    }

    // Clear credentials for security
    chrome.storage.local.remove(['portal_autologin']);
  }
}

// 1. Kiểm tra xem có lệnh chờ sẵn không
chrome.storage.local.get(['portal_autologin'], function(result) {
  if (result.portal_autologin) {
    // Chờ DOM tải xong
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => processPayload(result.portal_autologin), 500);
      });
    } else {
      setTimeout(() => processPayload(result.portal_autologin), 500);
    }
  }
});

// 2. Lắng nghe nếu storage thay đổi trong lúc tab này đang mở
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.portal_autologin) {
    if (changes.portal_autologin.newValue) {
      processPayload(changes.portal_autologin.newValue);
    }
  }
});
