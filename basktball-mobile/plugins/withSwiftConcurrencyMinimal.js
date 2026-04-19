/**
 * Expo config plugin that ensures Xcode 16.x compatibility for CocoaPods.
 *
 * Xcode 26 enables SWIFT_ENABLE_EXPLICIT_MODULES by default, which breaks
 * pods that rely on implicit module imports (e.g., @expo/dom-webview uses
 * RCTConvert without explicitly importing React). This plugin disables
 * explicit modules for all pod targets to restore the previous behavior,
 * allowing builds with stable Xcode 16.x.
 *
 * Key fix: injects settings AFTER the react_native_post_install() call
 * (including its closing parenthesis) so the code lives outside the
 * function call and doesn't cause Ruby syntax errors.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withSwiftConcurrencyMinimal(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      let contents = fs.readFileSync(podfilePath, 'utf8');

      const makeSnippet = (varName) => [
        '',
        '    # [BASKTBALL] Xcode 16.x compatibility — disable explicit modules',
        `    ${varName}.pods_project.build_configurations.each do |bc|`,
        `      bc.build_settings['SWIFT_ENABLE_EXPLICIT_MODULES'] = 'NO'`,
        '    end',
        `    ${varName}.pods_project.targets.each do |target|`,
        '      target.build_configurations.each do |bc|',
        `        bc.build_settings['SWIFT_ENABLE_EXPLICIT_MODULES'] = 'NO'`,
        '      end',
        '    end',
      ].join('\n');

      // Figure out the installer variable name from the post_install block
      const postInstallMatch = contents.match(/post_install\s+do\s+\|(\w+)\|/);
      const varName = postInstallMatch ? postInstallMatch[1] : 'installer';
      const snippet = makeSnippet(varName);

      // Strategy 1: Find react_native_post_install() and inject AFTER its closing paren
      const lines = contents.split('\n');
      const rnLineIdx = lines.findIndex(l => l.includes('react_native_post_install'));

      if (rnLineIdx !== -1) {
        // Track parenthesis depth to find the closing ) of this multi-line call
        let depth = 0;
        let closingIdx = rnLineIdx;
        for (let i = rnLineIdx; i < lines.length; i++) {
          for (const ch of lines[i]) {
            if (ch === '(') depth++;
            if (ch === ')') depth--;
          }
          if (depth <= 0) {
            closingIdx = i;
            break;
          }
        }

        // Insert snippet after the closing paren line
        const snippetLines = snippet.split('\n');
        lines.splice(closingIdx + 1, 0, ...snippetLines);
        contents = lines.join('\n');

        console.log(
          `[withSwiftConcurrencyMinimal] Injected SWIFT_ENABLE_EXPLICIT_MODULES=NO AFTER react_native_post_install (closing paren at line ${closingIdx + 1})`
        );
      } else if (postInstallMatch) {
        // Strategy 2: No react_native_post_install found, inject at start of post_install
        contents = contents.replace(
          /post_install\s+do\s+\|(\w+)\|/,
          `post_install do |${varName}|${snippet}`
        );
        console.log(
          '[withSwiftConcurrencyMinimal] Injected at START of post_install (no react_native_post_install found)'
        );
      } else {
        // Strategy 3: No post_install at all — append one
        contents += [
          '',
          '# [BASKTBALL] Xcode 16.x compatibility',
          'post_install do |installer|',
          makeSnippet('installer'),
          'end',
          '',
        ].join('\n');
        console.log(
          '[withSwiftConcurrencyMinimal] Appended new post_install block'
        );
      }

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};
