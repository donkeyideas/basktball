const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  // 1284x2778 (Apple App Store required size for 6.5" display)
  const context = await browser.newContext({
    viewport: { width: 428, height: 926 },
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();

  // LOGIN SCREEN
  await page.setContent(getLoginHTML());
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/Users/beltr/Basktball/basktball-mobile/store-assets/apple/screenshot-login.png', fullPage: false });
  console.log('Login screenshot saved');

  // SIGNUP SCREEN
  await page.setContent(getSignupHTML());
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/Users/beltr/Basktball/basktball-mobile/store-assets/apple/screenshot-signup.png', fullPage: false });
  console.log('Signup screenshot saved');

  await browser.close();
  console.log('Done!');
})();

function getLoginHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #0D0D0D;
  color: #fff;
  font-family: 'Inter', sans-serif;
  height: 926px;
  width: 428px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 24px;
}
.logo {
  font-family: 'Anton', sans-serif;
  font-size: 42px;
  text-align: center;
  letter-spacing: 3px;
  color: #fff;
  margin-bottom: 40px;
}
.heading {
  font-weight: 700;
  font-size: 28px;
  color: #FF6B35;
  text-align: center;
  letter-spacing: 2px;
  margin-bottom: 32px;
}
.apple-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #000;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
}
.apple-btn svg { width: 22px; height: 22px; fill: #fff; }
.apple-btn span { font-weight: 600; font-size: 16px; color: #fff; }
.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 24px;
}
.google-btn span { font-weight: 600; font-size: 16px; color: #333; }
.divider {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}
.divider .line { flex: 1; height: 1px; background: rgba(255,255,255,0.12); }
.divider .text { font-weight: 600; font-size: 12px; color: rgba(255,255,255,0.3); margin: 0 16px; letter-spacing: 1px; }
.input-wrap {
  display: flex;
  align-items: center;
  background: #1A1A1A;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  margin-bottom: 12px;
  padding: 0 14px;
}
.input-wrap svg { width: 18px; height: 18px; fill: rgba(255,255,255,0.4); margin-right: 10px; flex-shrink: 0; }
.input-wrap input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: rgba(255,255,255,0.25);
  padding: 14px 0;
}
.forgot { text-align: right; margin-bottom: 24px; }
.forgot a { font-size: 14px; color: #FF6B35; text-decoration: none; }
.signin-btn {
  background: #FF6B35;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  margin-bottom: 24px;
}
.signin-btn span { font-weight: 700; font-size: 18px; color: #fff; letter-spacing: 2px; }
.bottom { text-align: center; font-size: 14px; color: rgba(255,255,255,0.5); }
.bottom a { color: #FF6B35; font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
<div class="logo">BASKTBALL</div>
<div class="heading">SIGN IN</div>
<div class="apple-btn">
  <svg viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
  <span>Continue with Apple</span>
</div>
<div class="google-btn">
  <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
  <span>Continue with Google</span>
</div>
<div class="divider"><div class="line"></div><div class="text">OR</div><div class="line"></div></div>
<div class="input-wrap">
  <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
  <input value="Email" readonly>
</div>
<div class="input-wrap">
  <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
  <input value="Password" readonly>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
</div>
<div class="forgot"><a href="#">Forgot password?</a></div>
<div class="signin-btn"><span>SIGN IN</span></div>
<div class="bottom">Don't have an account? <a href="#">Create one</a></div>
</body>
</html>`;
}

function getSignupHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #0D0D0D;
  color: #fff;
  font-family: 'Inter', sans-serif;
  height: 926px;
  width: 428px;
  display: flex;
  flex-direction: column;
  padding: 40px 24px;
}
.back-btn {
  width: 40px; height: 40px; border-radius: 20px;
  background: #1A1A1A;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
}
.back-btn svg { width: 24px; height: 24px; fill: #fff; }
.logo {
  font-family: 'Anton', sans-serif;
  font-size: 36px;
  text-align: center;
  letter-spacing: 3px;
  color: #fff;
  margin-bottom: 24px;
}
.heading {
  font-weight: 700;
  font-size: 28px;
  color: #FF6B35;
  text-align: center;
  letter-spacing: 2px;
  margin-bottom: 28px;
}
.apple-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #000;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
}
.apple-btn svg { width: 22px; height: 22px; fill: #fff; }
.apple-btn span { font-weight: 600; font-size: 16px; color: #fff; }
.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 24px;
}
.google-btn span { font-weight: 600; font-size: 16px; color: #333; }
.divider {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}
.divider .line { flex: 1; height: 1px; background: rgba(255,255,255,0.12); }
.divider .text { font-weight: 600; font-size: 12px; color: rgba(255,255,255,0.3); margin: 0 16px; letter-spacing: 1px; }
.input-wrap {
  display: flex;
  align-items: center;
  background: #1A1A1A;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  margin-bottom: 12px;
  padding: 0 14px;
}
.input-wrap svg { width: 18px; height: 18px; fill: rgba(255,255,255,0.4); margin-right: 10px; flex-shrink: 0; }
.input-wrap input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: rgba(255,255,255,0.25);
  padding: 14px 0;
}
.create-btn {
  background: #FF6B35;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  margin-top: 12px;
  margin-bottom: 24px;
}
.create-btn span { font-weight: 700; font-size: 18px; color: #fff; letter-spacing: 2px; }
.bottom { text-align: center; font-size: 14px; color: rgba(255,255,255,0.5); }
.bottom a { color: #FF6B35; font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
<div class="back-btn"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></div>
<div class="logo">BASKTBALL</div>
<div class="heading">CREATE ACCOUNT</div>
<div class="apple-btn">
  <svg viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
  <span>Sign up with Apple</span>
</div>
<div class="google-btn">
  <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
  <span>Sign up with Google</span>
</div>
<div class="divider"><div class="line"></div><div class="text">OR</div><div class="line"></div></div>
<div class="input-wrap">
  <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
  <input value="Display Name" readonly>
</div>
<div class="input-wrap">
  <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
  <input value="Email" readonly>
</div>
<div class="input-wrap">
  <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
  <input value="Password" readonly>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
</div>
<div class="input-wrap">
  <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
  <input value="Confirm Password" readonly>
</div>
<div class="create-btn"><span>CREATE ACCOUNT</span></div>
<div class="bottom">Already have an account? <a href="#">Sign in</a></div>
</body>
</html>`;
}
