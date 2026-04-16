// Expo config plugin: allow non-modular header includes in framework modules.
//
// Required because @react-native-firebase pods (RNFBApp, etc.) are built as
// framework modules when `useFrameworks: "static"` is set, but they
// `#import <React/...>` from the non-modular React-Core pod. Without this
// flag, Xcode 16 fails the archive with:
//   include of non-modular header inside framework module 'RNFBApp.*'
//   [-Werror,-Wnon-modular-include-in-framework-module]
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "# >>> firebase-non-modular-headers";

function patchPodfile(contents) {
  if (contents.includes(MARKER)) return contents;

  const snippet = `
    ${MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        bc.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end
    # <<< firebase-non-modular-headers
`;

  if (/post_install do \|installer\|/.test(contents)) {
    return contents.replace(
      /post_install do \|installer\|/,
      `post_install do |installer|\n${snippet}`
    );
  }
  return `${contents}\npost_install do |installer|\n${snippet}end\n`;
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
