/**
 * Expo config plugin that fixes the macOS /var -> /private/var symlink issue
 * in EAS local builds.
 *
 * When EAS extracts the build tarball to /var/folders/..., Xcode's PROJECT_DIR
 * uses the symlinked path (/var/...) but Metro resolves its project root to
 * the real path (/private/var/...). path.relative() between these two prefixes
 * produces broken ../../ chains instead of a simple relative path.
 *
 * This plugin uses withDangerousMod to directly edit the .pbxproj file as raw
 * text AFTER all other base mods have run. This avoids the xcode npm parser
 * which chokes on $ characters in shell scripts.
 *
 * It prepends a line to the "Bundle React Native code and images" build phase
 * that normalizes PROJECT_DIR using `pwd -P` (physical path with symlinks
 * resolved), so all downstream paths are consistent.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PATCH_MARKER = '# [BASKTBALL] Resolve /var symlink for Metro bundler';

module.exports = function withRealpathFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosRoot = config.modRequest.platformProjectRoot;

      // Find the .xcodeproj directory
      const entries = fs.readdirSync(iosRoot);
      const xcodeprojDir = entries.find((e) => e.endsWith('.xcodeproj'));

      if (!xcodeprojDir) {
        console.log('[withRealpathFix] No .xcodeproj directory found, skipping');
        return config;
      }

      const pbxprojPath = path.join(iosRoot, xcodeprojDir, 'project.pbxproj');

      if (!fs.existsSync(pbxprojPath)) {
        console.log('[withRealpathFix] No project.pbxproj found, skipping');
        return config;
      }

      let contents = fs.readFileSync(pbxprojPath, 'utf8');

      // Check if already patched
      if (contents.includes(PATCH_MARKER)) {
        console.log('[withRealpathFix] Already patched, skipping');
        return config;
      }

      const lines = contents.split('\n');
      let inBundlePhase = false;
      let modified = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detect the Bundle React Native build phase block
        if (line.includes('Bundle React Native code and images')) {
          inBundlePhase = true;
          continue;
        }

        if (inBundlePhase && line.includes('shellScript = "')) {
          // Found the shellScript line - prepend our fix
          const patchPrefix =
            PATCH_MARKER +
            '\\n' +
            'export PROJECT_DIR=$(cd \\"$PROJECT_DIR\\" && pwd -P)' +
            '\\n';

          lines[i] = line.replace(
            'shellScript = "',
            'shellScript = "' + patchPrefix
          );
          inBundlePhase = false;
          modified = true;
          console.log(
            `[withRealpathFix] Patched shellScript at line ${i + 1}`
          );
          break;
        }

        // Reset if we hit end of block without finding shellScript
        if (inBundlePhase && line.trim() === '};') {
          inBundlePhase = false;
        }
      }

      if (modified) {
        fs.writeFileSync(pbxprojPath, lines.join('\n'));
        console.log('[withRealpathFix] Successfully wrote patched .pbxproj');
      } else {
        console.log(
          '[withRealpathFix] WARNING: Could not find "Bundle React Native code and images" shellScript to patch'
        );
      }

      return config;
    },
  ]);
};
