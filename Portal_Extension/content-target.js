// content-target.js

if (window.__portalLoginExecuted) {
  console.log("Portal login already executed, skipping.");
} else {
  window.__portalLoginExecuted = true;

  function setNativeValue(input, value) {
    try {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;

      nativeSetter.call(input, value);

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    } catch (e) {
      console.error("setNativeValue error", e);
      // Fallback if needed
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
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
          const storeEl = selectors.store ? document.querySelector(selectors.store) : null;
          const loginEl = selectors.login ? document.querySelector(selectors.login) : null;

          const result = {
            store: !!storeEl,
            username: !!usernameEl,
            password: !!passwordEl,
            login: !!loginEl
          };

          const highlightElement = (el) => {
            if (el) {
              el.style.border = "3px solid #10b981";
              el.style.backgroundColor = "#d1fae5";
              el.style.boxShadow = "0 0 10px #10b981";
              el.style.transition = "all 0.3s";
            }
          };

          highlightElement(storeEl);
          highlightElement(usernameEl);
          highlightElement(passwordEl);
          highlightElement(loginEl);
          
          const alertBox = document.createElement("div");
          alertBox.innerHTML = `
            <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); 
                        background: #10b981; color: white; padding: 15px 30px; border-radius: 8px; 
                        font-weight: bold; font-family: sans-serif; z-index: 999999; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
              ✅ QUÉT THÀNH CÔNG! Đã tìm thấy các ô (Viền màu xanh).
              <div style="font-size: 13px; font-weight: normal; margin-top: 5px;">Trang web sẽ tự động đóng sau 3 giây...</div>
            </div>
          `;
          document.body.appendChild(alertBox);

          chrome.storage.local.set({
            portal_test_result: {
              configId: payload.configId,
              result: result
            }
          }, () => {
            if (payload.storageKey) {
              chrome.storage.local.remove([payload.storageKey]);
            }
            setTimeout(() => {
              window.close();
            }, 3000);
          });
          return;
        }

        if (action === "LOGIN") {
          const creds = payload.credentials;
          const storeInput = selectors.store ? document.querySelector(selectors.store) : null;

          console.log("TAB URL:", window.location.href);
          console.log("REQUEST ID:", payload.requestId);
          console.log("STORAGE KEY:", payload.storageKey);
          console.log("USERNAME:", payload.credentials.username);
          console.log("EXECUTION TIME:", Date.now());
          console.log("USED FLAG:", payload.used);

          if (storeInput && creds.storeCode) {
            setNativeValue(storeInput, creds.storeCode);
          }

          if (usernameEl && creds.username) {
            setNativeValue(usernameEl, creds.username);
          }

          if (passwordEl && creds.password) {
            setNativeValue(passwordEl, creds.password);
          }
          
          if (payload.storageKey) {
            chrome.storage.local.remove([payload.storageKey]);
          }

          if (payload.autoSubmit && selectors.login) {
            setTimeout(() => {
              const btn = document.querySelector(selectors.login);
              if (btn) {
                btn.click();
              }
            }, 800);
          }
        }
      }
    }, 500);
  }

  function cleanupUrl() {
    const url = new URL(window.location.href);
    if (url.searchParams.has('portal_id')) {
      url.searchParams.delete('portal_id');
      window.history.replaceState({}, document.title, url.toString());
    }
  }

  function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const portalId = urlParams.get("portal_id");
    
    if (!portalId) return;

    const storageKey = `portal_autologin_${portalId}`;

    chrome.storage.local.get([storageKey], function(result) {
      const payload = result[storageKey];
      if (!payload) return;

      if (payload.requestId !== portalId) return;

      const currentHost = window.location.hostname;
      let expectedHost = "";
      try {
         expectedHost = new URL(payload.website).hostname;
      } catch(e) {
         expectedHost = payload.website;
      }
      
      if (currentHost !== expectedHost && !currentHost.includes(expectedHost)) {
        return;
      }

      if (payload.used === true) {
        return;
      }

      payload.used = true;
      payload.storageKey = storageKey;
      
      chrome.storage.local.set({ [storageKey]: payload }, () => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            processPayload(payload);
            cleanupUrl();
          });
        } else {
          processPayload(payload);
          cleanupUrl();
        }
      });
    });
  }

  init();
}
