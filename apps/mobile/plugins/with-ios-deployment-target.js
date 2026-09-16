/**
 * Custom Expo config plugin: raises IPHONEOS_DEPLOYMENT_TARGET on every pod
 * target, including resource bundles.
 *
 * Why: `expo-build-properties` sets `ios.deploymentTarget` on the app and on
 * regular pod targets, but resource-bundle targets keep whatever their podspec
 * declares. A few transitive pods still ship very old values — RNSVGFilters at
 * 12.4, RNCAsyncStorage resources at 13.4, SDWebImage at 9.0 — and recent Xcode
 * refuses anything below 15.0, so the build dies with three errors that have
 * nothing to do with this app's code.
 *
 * Approach: append a loop to the Podfile's existing `post_install` block that
 * walks every target and raises anything below the floor. Kept as a plugin
 * rather than a hand edit because `ios/` is generated — a Podfile patch would
 * be wiped by the next `expo prebuild`.
 */

const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# with-ios-deployment-target';

function buildSnippet(target) {
  return `
    ${MARKER}: resource bundles keep their podspec value, so raise them here.
    installer.pods_project.targets.each do |t|
      t.build_configurations.each do |bc|
        current = bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || current.to_f < ${target}
          bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${target}'
        end
      end
    end
`;
}

module.exports = function withIosDeploymentTarget(config, { deploymentTarget = '15.1' } = {}) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      if (contents.includes(MARKER)) return cfg;

      const anchor = 'post_install do |installer|';
      if (!contents.includes(anchor)) {
        throw new Error(
          `with-ios-deployment-target: could not find "${anchor}" in the Podfile. ` +
            'The Expo template changed; update this plugin.'
        );
      }

      contents = contents.replace(anchor, anchor + buildSnippet(deploymentTarget));
      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
