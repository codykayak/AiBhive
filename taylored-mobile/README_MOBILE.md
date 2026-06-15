# Taylored Mobile

This is a standalone React Native application built with Expo.

## Installation & Setup

1. **Install Dependencies:**
   Navigate into the `taylored-mobile` directory and run:
   ```bash
   npm install
   ```

2. **Run in Development (Expo Go):**
   You can run the app directly on your phone using the Expo Go app.
   ```bash
   npx expo start
   ```
   Scan the QR code with your phone's camera (iOS) or the Expo Go app (Android).

## Building the Android APK

To build a standalone APK that you can install directly on your Android device (without Expo Go), you need an Expo account.

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Build the APK:**
   Run the following command from the `taylored-mobile` directory:
   ```bash
   eas build -p android --profile preview
   ```
   Wait for the build to finish. The CLI will output a link to download the `.apk` file.

4. **Install on Phone:**
   Download the `.apk` file to your Android phone, tap on it to install, and ensure "Install from Unknown Sources" is enabled in your Android settings.

## Note on API Keys
When the app launches, tap the **Settings** tab (gear icon at the bottom right) to input your **Gemini** and **Firecrawl** API keys. These are saved securely on your device and are required for the AI and Search functionalities to work.
