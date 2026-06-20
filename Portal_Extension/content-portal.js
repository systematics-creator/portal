// content-portal.js
// This script runs only on the Portal website (defined in manifest.json matches)

// Lắng nghe Message từ trang React (Portal)
window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source !== window) return;

  if (event.data && event.data.type === "PORTAL_AUTO_LOGIN") {
    const payload = event.data.data;
    
    // Save to Chrome Storage for content-target.js to read
    chrome.storage.local.set({ portal_autologin: payload }, function() {
      console.log("[Portal Extension] Đã lưu payload vào Storage:", payload);
    });
  }
});

// Lắng nghe thay đổi từ Storage (khi quá trình test có kết quả từ content-target)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.portal_test_result) {
    const resultPayload = changes.portal_test_result.newValue;
    if (resultPayload) {
      // Gửi ngược về cho Portal React App
      window.postMessage({
        type: "PORTAL_TEST_RESULTS",
        data: resultPayload
      }, "*");

      // Xoá result đi để không bị bắt sự kiện lặp lại
      chrome.storage.local.remove(['portal_test_result']);
    }
  }
});
