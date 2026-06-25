const {
  withAndroidManifest,
  withMainActivity,
  AndroidConfig,
} = require('@expo/config-plugins');

const { getMainActivityOrThrow } = AndroidConfig.Manifest;

const CONFIG_CHANGES =
  'keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode|smallestScreenSize|density|navigation';

const SAMSUNG_META = [
  { name: 'com.samsung.android.keepalive.density', value: 'true' },
  { name: 'com.samsung.android.multidisplay.keep_process_alive', value: 'true' },
  { name: 'android.supports_size_changes', value: 'true' },
];

function upsertMetaData(application, name, value) {
  if (!application['meta-data']) {
    application['meta-data'] = [];
  }
  const list = application['meta-data'];
  const existing = list.find((item) => item.$?.['android:name'] === name);
  if (existing) {
    existing.$['android:value'] = value;
    return;
  }
  list.push({
    $: {
      'android:name': name,
      'android:value': value,
    },
  });
}

function withDexManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const application = manifest.application?.[0];
    if (!application) return cfg;

    application.$['android:resizeableActivity'] = 'true';

    const supports = {
      $: {
        'android:smallScreens': 'true',
        'android:normalScreens': 'true',
        'android:largeScreens': 'true',
        'android:xlargeScreens': 'true',
        'android:anyDensity': 'true',
        'android:resizeable': 'true',
      },
    };

    const existing = manifest['supports-screens'];
    if (Array.isArray(existing) && existing.length) {
      Object.assign(existing[0].$, supports.$);
    } else {
      manifest['supports-screens'] = [supports];
    }

    for (const meta of SAMSUNG_META) {
      upsertMetaData(application, meta.name, meta.value);
    }

    try {
      const mainActivity = getMainActivityOrThrow(cfg.modResults);
      mainActivity.$['android:resizeableActivity'] = 'true';
      mainActivity.$['android:configChanges'] = CONFIG_CHANGES;
      // Let DeX choose orientation; never lock portrait on the activity.
      mainActivity.$['android:screenOrientation'] = 'unspecified';
      delete mainActivity.$['android:maxAspectRatio'];
      delete mainActivity.$['android:minAspectRatio'];
    } catch {
      // MainActivity missing during introspection — ignore.
    }

    return cfg;
  });
}

/** Re-sync RN display metrics when DeX resizes the window (RN 0.85+ multi-display density bug). */
function withDexDisplayMetrics(config) {
  return withMainActivity(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (contents.includes('DisplayMetricsHolder.initDisplayMetrics')) {
      return cfg;
    }

    if (!contents.includes('com.facebook.react.uimanager.DisplayMetricsHolder')) {
      contents = contents.replace(
        'import expo.modules.ReactActivityDelegateWrapper',
        'import android.content.res.Configuration\nimport com.facebook.react.uimanager.DisplayMetricsHolder\nimport expo.modules.ReactActivityDelegateWrapper'
      );
    }

    contents = contents.replace(
      'super.onCreate(null)',
      'super.onCreate(null)\n    DisplayMetricsHolder.initDisplayMetrics(this)'
    );

    if (!contents.includes('override fun onConfigurationChanged')) {
      contents = contents.replace(
        '  override fun invokeDefaultOnBackPressed() {',
        `  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    DisplayMetricsHolder.initDisplayMetrics(this)
  }

  override fun invokeDefaultOnBackPressed() {`
      );
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

/** Samsung DeX / tablet: resizable free-form window + correct density on external displays. */
function withLargeScreenSupport(config) {
  config = withDexManifest(config);
  config = withDexDisplayMetrics(config);
  return config;
}

module.exports = withLargeScreenSupport;
