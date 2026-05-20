// Google Digital Asset Links (DAL) — Android equivalent of AASA.
// Lets Android verify that the Sintonia app can handle https links to
// sintonia.party. With autoVerify=true in the intent-filter, Android
// checks this file on app install and again periodically.
//
// IMPORTANT: replace the SHA256_CERT_FINGERPRINTS placeholder with the
// real signing certificate fingerprint(s). Three sources, in order:
//
//   1. EAS Build managed credentials:
//        eas credentials --platform android
//      Look for "Keystore" → "SHA256 Fingerprint"
//
//   2. Google Play App Signing key (if Play handles your signing):
//        Play Console → App → Setup → App signing → App signing key
//        certificate → SHA-256 certificate fingerprint
//
//   3. Local debug keystore (for testing):
//        keytool -list -v -keystore ~/.android/debug.keystore \
//          -alias androiddebugkey -storepass android -keypass android
//
// You can ship multiple fingerprints in the array — typical setup
// includes BOTH the Play upload key AND the Play signing key, since
// Play re-signs the APK after upload.
//
// Verify after deploy with:
//   https://digitalassetlinks.googleapis.com/v1/statements:list
//     ?source.web.site=https://sintonia.party
//     &relation=delegate_permission/common.handle_all_urls

const ANDROID_PACKAGE = "com.bruno.wavelength";
const SHA256_CERT_FINGERPRINTS: string[] = [
  // TODO: replace with the real SHA-256 fingerprint(s).
  // Format: "AA:BB:CC:DD:EE:FF:..." (32 hex pairs separated by ":")
  "REPLACE:WITH:REAL:SHA256:FINGERPRINT:FROM:EAS:OR:PLAY:CONSOLE",
];

const ASSET_LINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: ANDROID_PACKAGE,
      sha256_cert_fingerprints: SHA256_CERT_FINGERPRINTS,
    },
  },
];

export async function GET() {
  return new Response(JSON.stringify(ASSET_LINKS), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
