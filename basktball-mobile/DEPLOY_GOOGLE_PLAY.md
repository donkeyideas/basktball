# BASKTBALL - Google Play Deployment Guide

## What's Already Done

- [x] EAS project initialized (ID: f155a87c-d074-43c1-ac99-7a8a10c64c81)
- [x] eas.json created with dev/preview/production profiles
- [x] app.json configured with Android adaptive icons, permissions, versionCode
- [x] Android signing keystore generated (basktball-keystore.jks)
- [x] Local credentials configured (credentials.json)
- [x] Store listing content prepared (STORE_LISTING.md)
- [x] Notification icon created
- [x] .gitignore updated for secrets

## Build the AAB

```bash
cd basktball-mobile
npx eas build --platform android --profile production --non-interactive
```

This creates an Android App Bundle (AAB) on EAS cloud servers. Build takes ~10-15 min.

Check build status:
```bash
npx eas build:list --platform android --limit 5
```

Download the AAB when complete:
```bash
npx eas build:download --platform android --latest
```

## Google Play Console Setup

### 1. Create the App
1. Go to https://play.google.com/console
2. Click "Create app"
3. App name: **BASKTBALL**
4. Default language: English (United States)
5. App type: App
6. Free or paid: Free
7. Accept declarations

### 2. Store Listing (Main store listing)
Use content from STORE_LISTING.md:
- Short description (80 chars max)
- Full description
- App icon: 512x512 (auto-generated from build)
- Feature graphic: 1024x500 (needs to be created - see below)
- Phone screenshots: minimum 2, recommended 8 at 1080x1920

### 3. Screenshots
Take screenshots from the running app or Expo development build:
```bash
# Run on Android emulator
npx expo start --android
```
Use Android Studio's screenshot tool or `adb exec-out screencap -p > screenshot.png`

### 4. Content Rating
1. Go to Policy > App content > Content rating
2. Start questionnaire (IARC)
3. Category: Social/Communication
4. No violence, no sexual content, no gambling, user interaction present
5. Expected rating: Everyone

### 5. App Signing
Google Play manages app signing by default:
1. Go to Release > Setup > App signing
2. Choose "Let Google manage and protect your app signing key" (recommended)
3. Upload your keystore OR use the Google-generated key
4. The upload keystore (basktball-keystore.jks) is used to sign uploads; Google re-signs for distribution

### 6. Create a Release

#### Internal Testing (Recommended first)
1. Go to Release > Testing > Internal testing
2. Click "Create new release"
3. Upload the AAB file (downloaded from EAS build)
4. Add release notes: "Initial release - v1.0.0"
5. Save and review

#### Production Release
1. Complete all pre-launch requirements (store listing, content rating, privacy policy, etc.)
2. Go to Release > Production
3. Create new release
4. Upload AAB
5. Submit for review

## Automated Submit via EAS (Optional)

### Setup Google Service Account
1. Go to Google Cloud Console: https://console.cloud.google.com
2. Create or select a project
3. Enable "Google Play Android Developer API"
4. Create a Service Account with role "Service Account User"
5. Create a JSON key for the service account
6. Save as `basktball-mobile/google-service-account.json`
7. In Google Play Console > Setup > API access, link the service account
8. Grant "Release manager" permissions

### Submit via EAS
```bash
npx eas submit --platform android --profile production --latest
```

## Privacy Policy & Terms
These pages must be live before Play Store approval:
- Privacy: https://basktball.vercel.app/legal/privacy
- Terms: https://basktball.vercel.app/legal/terms

## Data Safety Form
Required by Google Play. Fill out in Play Console > Policy > App content > Data safety:

Data collected:
- Email address (account creation)
- Username/display name (account feature)
- User-generated content (takes/posts)

Data shared: None (not shared with third parties)

Security practices:
- Data encrypted in transit (HTTPS)
- Data can be deleted (user can request account deletion)

## Version Updates
For future releases, bump version in app.json:
```json
"version": "1.1.0"  // Display version
```
versionCode auto-increments via eas.json `autoIncrement: true`.

Then rebuild:
```bash
npx eas build --platform android --profile production --non-interactive
```

## Important Files
| File | Purpose |
|------|---------|
| eas.json | EAS Build/Submit configuration |
| app.json | Expo app configuration |
| credentials.json | Local signing credentials (gitignored) |
| basktball-keystore.jks | Android signing keystore (gitignored) |
| google-service-account.json | Google Play API key (gitignored, create manually) |
| STORE_LISTING.md | Store listing copy |

## Keystore Backup
CRITICAL: Back up your keystore file securely. If lost, you cannot update your app on Google Play.
- File: basktball-keystore.jks
- Password: basktball2026
- Key alias: basktball-key
- Key password: basktball2026

Store these credentials in a secure password manager.
