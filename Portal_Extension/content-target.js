// content-target.js

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

        // VISUAL FEEDBACK: Highlight the found elements!
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
        
        // Show a floating alert on the screen
        const alertBox = document.createElement("div");
        alertBox.innerHTML = `
          <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); 
                      background: #10b981; color: white; padding: 15px 30px; border-radius: 8px; 
                      font-weight: bold; font-family: sans-serif; z-index: 999999; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
            ✅ QUÉT THÀNH CÔNG! Đã tìm thấy các ô (Viền màu xanh).
            <div style="font-size: 13px; font-weight: normal; margin-top: 5px;">Bạn hãy đóng trang này và quay lại Portal.</div>
          </div>
        `;
        document.body.appendChild(alertBox);

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
        const storeInput = selectors.store ? document.querySelector(selectors.store) : null;

        console.log("=== AUTO LOGIN DEBUG ===");
        console.log("Store Input Found", storeInput);
        console.log("Username Input Found", usernameEl);
        console.log("Password Input Found", passwordEl);

        if (storeInput && creds.storeCode) {
          setNativeValue(storeInput, creds.storeCode);
          console.log("Store Value set to", storeInput.value);
        }

        if (usernameEl && creds.username) {
          setNativeValue(usernameEl, creds.username);
          console.log("Username Value set to", usernameEl.value);
        }

        if (passwordEl && creds.password) {
          setNativeValue(passwordEl, creds.password);
          console.log("Password Value set to", passwordEl.value);
        }

        if (payload.autoSubmit && selectors.login) {
          setTimeout(() => {
            const btn = document.querySelector(selectors.login);
            if (btn) {
              console.log("Clicking Login Button", btn);
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
