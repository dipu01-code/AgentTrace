# Publishing the Android app

Two routes:
- An **APK** you send to testers directly.
- An **AAB** for the Google Play Store. Play no longer accepts APKs for new apps.

Both use EAS Build, which builds in Expo's cloud, so you don't need Android Studio.

## 1. Put the backend online (required first)

A phone can't reach `localhost`, and release Android builds block plain `http://`, so the API needs a public **https** URL.

1. Deploy `docker-compose.yml` (API + MongoDB) to any host: Render, Railway, Fly.io, or a VPS with Caddy/nginx for HTTPS.
   ```bash
   JWT_SECRET=$(openssl rand -base64 48) docker compose up -d --build
   ```
2. Check it: `curl https://YOUR-API-DOMAIN/health` returns `{"status":"ok",...}`.
3. Put that URL in `eas.json` under `build.preview.env` and `build.production.env`:
   ```json
   "env": { "EXPO_PUBLIC_API_URL": "https://YOUR-API-DOMAIN" }
   ```

## 2. One-time EAS setup

```bash
npm install -g eas-cli
eas login        # your Expo account
eas init         # links this project; adds extra.eas.projectId to app.json
```

`eas init` also enables real push notifications for stuck runs. Without it the app only checks while it's open.

## 3. Build the APK

```bash
eas build -p android --profile preview
```

- This takes about 10–20 minutes. EAS creates and stores the signing key the first time. Answer **Yes** when it asks to generate a keystore.
- When it finishes you get a link and a QR code. Open it to download `AgentTrace.apk`. It's also listed under https://expo.dev → your project → Builds.

## 4. Share and install the APK

- Send the download link (or the `.apk` file) to testers.
- On the phone: open the file and allow **Install unknown apps** for the browser or file manager when Android asks.
- Or, with USB debugging on: `adb install AgentTrace.apk`.

To ship an update, bump `"version"` in `app.json`, rebuild, and send the new APK. Installing over the old one keeps the user's data, because it's signed with the same EAS key.

## 5. Publish on Google Play (AAB)

1. Create a Google Play Console developer account ($25 one-time) at https://play.google.com/console.
2. Create an app. The package name must be **`com.agenttrace.app`** (from `app.json`).
3. Build the store bundle (the version code auto-increments):
   ```bash
   eas build -p android --profile production
   ```
4. **First release only:** download the `.aab` from the build page and upload it by hand in Play Console → *Testing → Internal testing → Create release*. Google requires this first manual upload.
5. Later releases can go up from the terminal. Create a Google service-account JSON key (Play Console → *Setup → API access*), then:
   ```bash
   eas submit -p android --profile production
   ```
6. Fill in the store listing before you promote to Production:
   - App icon 512×512: `assets/brand/play-store-icon-512.png`
   - Feature graphic 1024×500, and at least 2 phone screenshots
   - **Privacy policy URL** (required: the app collects email addresses)
   - Data safety form (email, account info), content rating questionnaire, target audience

Google reviews new apps, which usually takes a few days. Personal developer accounts must run a closed test with testers before they can publish to Production.

## Alternative: build the APK on your Mac (no EAS)

You need Android Studio (SDK) and **JDK 17**. JDK 27, which is installed now, is too new for the Android build tools.

```bash
brew install --cask zulu@17 android-studio   # then open Android Studio once to install the SDK
export JAVA_HOME=$(/usr/libexec/java_home -v 17) ANDROID_HOME=~/Library/Android/sdk
EXPO_PUBLIC_API_URL=https://YOUR-API-DOMAIN npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
```

That APK is signed with a debug key: fine for testers, but not accepted by the Play Store.

## Updating the logo

Edit `assets/brand/logo-mark.svg` (the symbol) or `assets/brand/logo.svg` (symbol on background), then run `python3 assets/brand/export_icons.py`. It regenerates every icon size. Rebuild the app afterwards.
