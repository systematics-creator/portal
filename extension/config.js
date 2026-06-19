const siteConfigs = {
  // Configs are mapped by hostname
  "posspa.dichvupro.net": {
    storeSelector: "input[placeholder='ABC123']",
    usernameSelector: "input[placeholder='lan.tran']",
    passwordSelector: "input[type='password']",
    loginButtonSelector: "button[type='submit']"
  },
  "logo.dichvupro.net": {
    usernameSelector: "input[type='email'], input[name='email'], input[name='username']",
    passwordSelector: "input[type='password']",
    loginButtonSelector: "button[type='submit']"
  },
  "app.dichvupro.net": {
    storeSelector: "input[name='store_code'], input[name='tenant'], input[type='text']",
    usernameSelector: "input[type='email'], input[name='email'], input[name='username']",
    passwordSelector: "input[type='password']",
    loginButtonSelector: "button[type='submit']"
  }
};

// Make it available to content-target.js which runs in the same context
window.PORTAL_SITE_CONFIGS = siteConfigs;
