const { withAndroidManifest } = require('@expo/config-plugins');

/** Samsung DeX / tablet: allow the activity to fill the desktop window. */
function withLargeScreenSupport(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const application = manifest.application?.[0];
    if (application?.$) {
      application.$['android:resizeableActivity'] = 'true';
    }

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

    return cfg;
  });
}

module.exports = withLargeScreenSupport;
