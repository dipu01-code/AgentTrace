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
    // Only the emulator's ABI is compiled to keep local builds fast; EAS builds all ABIs.
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug -PreactNativeArchitectures=arm64-v8a && cd ..',
      reversePorts: [8081, 8000],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
      build:
        'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release -PreactNativeArchitectures=arm64-v8a && cd ..',
      reversePorts: [8000],
    },
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: 'iPhone 17' } },
    emulator: { type: 'android.emulator', device: { avdName: 'AgentTrace_API36' } },
  },
  configurations: {
    'ios.sim.release': { device: 'simulator', app: 'ios.release' },
    'ios.sim.debug': { device: 'simulator', app: 'ios.debug' },
    'android.emu.debug': { device: 'emulator', app: 'android.debug' },
    'android.emu.release': { device: 'emulator', app: 'android.release' },
  },
};
