/**
 * Custom Expo config plugin: forces the Android splash screen to be a true
 * full-screen image (waves bleeding off both edges, stars across the canvas),
 * matching the iOS full-screen splash.
 *
 * Why: `expo-splash-screen` on Android uses `Theme.App.SplashScreen` with the
 * AndroidX SplashScreen API, which constrains the splash to a tiny centered
 * icon clipped to a ~192dp circle. There's no first-class API for a custom
 * full-bleed splash image — and we can't reliably patch `Theme.App.SplashScreen`
 * itself because another mod re-writes it during prebuild.
 *
 * Approach:
 *   1. ADD a brand-new theme `Theme.Wavelength.Splash` that extends `AppTheme`
 *      and only sets `android:windowBackground = @drawable/wl_splash_full`.
 *      We never touch `Theme.App.SplashScreen`.
 *   2. PATCH `AndroidManifest.xml` so `MainActivity` uses our new theme on
 *      launch, instead of `Theme.App.SplashScreen`.
 *   3. WRITE the drawable XML (`<bitmap android:gravity="fill"/>`) and copy
 *      `assets/images/splash-icon.png` (the iOS portrait splash) into
 *      `drawable-nodpi/wl_splash_image.png`.
 *
 * Caveats:
 *   - `android:gravity="fill"` stretches non-proportionally. Our source is
 *     1080x2400 (≈1:2.22) which is nearly identical to typical modern phone
 *     aspect (~1:2.17), so the distortion is imperceptible on phones.
 *   - On Android 12+, the system SplashScreen API may show a brief system
 *     splash (transparent background color) before transitioning to the
 *     activity. The activity's windowBackground (our drawable) shows next.
 */
const fs = require('fs');
const path = require('path');
const {
  withAndroidStyles,
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins');

const DRAWABLE_XML = `<?xml version="1.0" encoding="utf-8"?>
<bitmap xmlns:android="http://schemas.android.com/apk/res/android"
    android:src="@drawable/wl_splash_image"
    android:gravity="fill" />
`;

// Transparent 1x1 drawable used to suppress the AndroidX SplashScreen icon
// overlay so only our full-bleed windowBackground is visible.
const TRANSPARENT_XML = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
  <solid android:color="@android:color/transparent" />
</shape>
`;

const NEW_THEME_NAME = 'Theme.Wavelength.Splash';

function addCustomTheme(modResults) {
  const styles = modResults?.resources?.style;
  if (!Array.isArray(styles)) return modResults;

  // Idempotent: remove any prior instance of our theme.
  const filtered = styles.filter((s) => s?.$?.name !== NEW_THEME_NAME);

  // Extend Theme.SplashScreen so the core-splashscreen layout (which uses
  // `?attr/splashScreenIconSize`) can inflate. Override the splash overlay
  // attrs to be transparent/invisible so only our windowBackground shows.
  filtered.push({
    $: { name: NEW_THEME_NAME, parent: 'Theme.SplashScreen' },
    item: [
      {
        $: { name: 'windowSplashScreenBackground' },
        _: '@android:color/transparent',
      },
      {
        $: { name: 'windowSplashScreenAnimatedIcon' },
        _: '@drawable/wl_transparent',
      },
      {
        $: { name: 'postSplashScreenTheme' },
        _: '@style/AppTheme',
      },
      {
        $: { name: 'android:windowBackground' },
        _: '@drawable/wl_splash_full',
      },
    ],
  });

  modResults.resources.style = filtered;
  return modResults;
}

function setMainActivityTheme(modResults) {
  // The AndroidManifest.xml is parsed into an object. The application's
  // activities are at modResults.manifest.application[0].activity.
  const app = modResults?.manifest?.application?.[0];
  if (!app || !Array.isArray(app.activity)) return modResults;

  const mainActivity = app.activity.find(
    (a) => a?.$?.['android:name'] === '.MainActivity',
  );
  if (!mainActivity) return modResults;
  mainActivity.$['android:theme'] = `@style/${NEW_THEME_NAME}`;
  return modResults;
}

function writeDrawableXml(resDir) {
  const drawableDir = path.join(resDir, 'drawable');
  fs.mkdirSync(drawableDir, { recursive: true });
  fs.writeFileSync(path.join(drawableDir, 'wl_splash_full.xml'), DRAWABLE_XML);
  fs.writeFileSync(path.join(drawableDir, 'wl_transparent.xml'), TRANSPARENT_XML);
}

function copySplashImage(srcImagePath, resDir) {
  if (!fs.existsSync(srcImagePath)) return false;
  const dpiDir = path.join(resDir, 'drawable-nodpi');
  fs.mkdirSync(dpiDir, { recursive: true });
  fs.copyFileSync(srcImagePath, path.join(dpiDir, 'wl_splash_image.png'));
  return true;
}

const withAndroidFullScreenSplash = (config) => {
  config = withAndroidStyles(config, (c) => {
    c.modResults = addCustomTheme(c.modResults);
    return c;
  });
  config = withAndroidManifest(config, (c) => {
    c.modResults = setMainActivityTheme(c.modResults);
    return c;
  });
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const resDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
      );
      const splashSrc = path.join(
        projectRoot,
        'assets',
        'images',
        'splash-icon.png',
      );
      writeDrawableXml(resDir);
      const copied = copySplashImage(splashSrc, resDir);
      // eslint-disable-next-line no-console
      console.log('[with-android-fullscreen-splash] drawable+image copied=', copied);
      return cfg;
    },
  ]);
  return config;
};

module.exports = withAndroidFullScreenSplash;
