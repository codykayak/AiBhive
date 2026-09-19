/** Minimal plugin — permissions live in app.json; native files copied in post-prebuild script */
module.exports = function withSmsBridge(config) {
  return config;
};
