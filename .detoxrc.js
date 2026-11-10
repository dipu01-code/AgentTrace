/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: { $0: 'jest', config: 'e2e/jest.config.js' },
    jest: { setupTimeout: 180000 },
  },
  apps: {
    // Release bundles the JS into the app, so E2E needs no Metro. Debug uses Metro on :8081.
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/AgentTrace.app',
      build:
        'xcodebuild -workspace ios/AgentTrace.xcworkspace -scheme AgentTrace -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet',
    },
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/AgentTrace.app',
      build:
        'xcodebuild -workspace ios/AgentTrace.xcworkspace -scheme AgentTrace -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build -quiet',
    },
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: 'iPhone 17' } },
  },
  configurations: {
    'ios.sim.release': { device: 'simulator', app: 'ios.release' },
    'ios.sim.debug': { device: 'simulator', app: 'ios.debug' },
  },
};
