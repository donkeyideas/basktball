// Expo config plugin: enable modular headers for @react-native-firebase pods.
//
// @react-native-firebase v22+ pulls in Firebase Swift pods (e.g.
// FirebaseCoreInternal) that depend on Obj-C pods like GoogleUtilities.
// Without module maps, pod install fails with:
//
//   The Swift pod `FirebaseCoreInternal` depends upon `GoogleUtilities`,
//   which does not define modules.
//
// `use_modular_headers!` makes every Obj-C pod generate a module map so
// Swift pods can `@import` them. We avoid `use_frameworks! :linkage => :static`
// because it triggers a separate set of Xcode 16 compile errors in
// RNFBMessaging (RCTPromiseRejectBlock / RCT_EXPORT_MODULE not visible).
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "# >>> firebase-modular-headers";

function patchPodfile(contents) {
  if (contents.includes(MARKER)) return contents;

  // Inject `use_modular_headers!` right after `prepare_react_native_project!`
  // so it applies to every target (including the `BASKTBALL` app target).
  const inject = `\n${MARKER}\nuse_modular_headers!\n# <<< firebase-modular-headers\n`;

  if (/prepare_react_native_project!\s*\n/.test(contents)) {
    return contents.replace(
      /(prepare_react_native_project!\s*\n)/,
      `$1${inject}`
    );
  }

  // Fallback: prepend before the first `target ... do` block.
  if (/^target\s+['"]/m.test(contents)) {
    return contents.replace(/(^target\s+['"])/m, `${inject}\n$1`);
  }

  // Last resort: append.
  return `${contents}${inject}`;
}

module.exports = function withFirebaseNonModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        "Podfile"
      );
      const before = fs.readFileSync(podfilePath, "utf8");
      const after = patchPodfile(before);
      if (before !== after) fs.writeFileSync(podfilePath, after);
      return cfg;
    },
  ]);
};
