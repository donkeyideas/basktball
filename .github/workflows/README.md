# GitHub Actions — Mobile Builds

These workflows build the BASKTBALL Android (`.aab`) and iOS (`.ipa`) apps on
GitHub-hosted runners using **`eas build --local`**, which does NOT consume EAS
Build cloud credits. Each run uploads the binary as a downloadable artifact.

## Triggering a build

1. Push to GitHub.
2. Go to **Actions** tab → pick **Build Android (AAB)** or **Build iOS (IPA)**.
3. Click **Run workflow** → choose `production` or `preview` → **Run**.
4. When green, scroll to the bottom of the run page and download the artifact.

## Required GitHub Secrets

Settings → Secrets and variables → Actions → **New repository secret**.

### Common (both platforms)

| Secret | Where to get it |
| --- | --- |
| `EXPO_TOKEN` | https://expo.dev/accounts/donkeyideas/settings/access-tokens → "Create token". Required so EAS can sign in non-interactively. |

### Android only

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64 of `basktball-mobile/basktball-keystore.jks`. Generate with PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("basktball-mobile/basktball-keystore.jks")) | Set-Clipboard` |
| `ANDROID_KEYSTORE_PASSWORD` | `basktball2026` (from your local `credentials.json`) |
| `ANDROID_KEY_ALIAS` | `basktball-key` |
| `ANDROID_KEY_PASSWORD` | `basktball2026` |

### iOS

No additional secrets needed. `eas.json` has `credentialsSource: "remote"` for
iOS, so EAS pulls the distribution certificate and provisioning profile from
your Expo account using `EXPO_TOKEN`.

## After the build

### Android — upload to Play Store
```bash
# Download the artifact, then:
fastlane supply --aab basktball-production.aab --track internal
# OR upload manually at https://play.google.com/console
```

### iOS — upload to App Store Connect
```bash
xcrun altool --upload-app --type ios --file basktball-production.ipa \
  --username "YOUR_APPLE_ID" --password "APP_SPECIFIC_PASSWORD"
# OR drag the .ipa into Transporter.app
```

You can also automate submission by adding `eas submit` steps later, but they
require additional secrets (App Store Connect API key, Google service account).

## Free-tier notes

- **Linux runners**: 2,000 free minutes/month. Each Android build ≈ 15–25 min.
- **macOS runners**: 10× multiplier. Each iOS build ≈ 25–40 min, so a build
  consumes 250–400 of your free 2,000-minute pool. Roughly 5 iOS builds/month.
