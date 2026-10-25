const { randomUUID } = require("crypto");

const PRESET_MODELS = [
  { model: "iPhone14,2", name: "iPhone 13 Pro", hw: "hw/iPhone14_2", ios: "17.4.1" },
  { model: "iPhone14,5", name: "iPhone 13", hw: "hw/iPhone14_5", ios: "17.5.1" },
  { model: "iPhone15,2", name: "iPhone 14 Pro", hw: "hw/iPhone15_2", ios: "17.6.1" },
  { model: "iPhone15,3", name: "iPhone 14 Pro Max", hw: "hw/iPhone15_3", ios: "18.0.1" },
  { model: "iPhone16,1", name: "iPhone 15 Pro", hw: "hw/iPhone16_1", ios: "18.1.0" }
];

class DeviceProfile {
  constructor(options = {}) {
    const {
      autoEmulate = true,
      installationId = null,
      bundleId = null,
      appVersion = null,
      buildNumber = null,
      modelName = null,
      iosVersion = null,
      hardwareModel = null,
      customUserAgent = null,
      customAnalytics = null,
      appcheckToken = null,
      instanceIdToken = null
    } = options;

    this.autoEmulate = autoEmulate;
    this._preset = PRESET_MODELS[Math.floor(Math.random() * PRESET_MODELS.length)];

    this.installationId = installationId || randomUUID().replace(/-/g, "").slice(0, 22);
    this.bundleId = bundleId || "com.locket.Locket";
    this.appVersion = appVersion || "2.68.0";
    this.buildNumber = buildNumber || "2523";

    const hw = hardwareModel || this._preset.model;
    const hwTag = hw.startsWith("hw/") ? hw : `hw/${hw}`;
    this.modelInfo = {
      name: modelName || this._preset.name,
      model: hw,
      hw: hwTag,
      ios: iosVersion || this._preset.ios
    };

    this.customUserAgent = customUserAgent;
    this.customAnalytics = customAnalytics;
    this.appcheckToken = appcheckToken;
    this.instanceIdToken = instanceIdToken;
  }

  get userAgent() {
    if (!this.autoEmulate && this.customUserAgent) {
      return this.customUserAgent;
    }
    return `${this.bundleId}/${this.appVersion} iPhone/${this.modelInfo.ios} ${this.modelInfo.hw}`;
  }

  get analyticsData() {
    if (!this.autoEmulate && this.customAnalytics) {
      return this.customAnalytics;
    }
    return {
      ios_version: `${this.appVersion}.${this.buildNumber}`,
      experiments: {
        flag_18: { "@type": "type.googleapis.com/google.protobuf.Int64Value", value: "1203" },
        flag_7: { "@type": "type.googleapis.com/google.protobuf.Int64Value", value: "800" },
        flag_10: { "@type": "type.googleapis.com/google.protobuf.Int64Value", value: "505" }
      },
      installation_id: this.installationId,
      platform: "ios"
    };
  }

  get defaultHeaders() {
    const headers = {
      "User-Agent": this.userAgent,
      "Content-Type": "application/json",
      "Accept": "*/*",
      "x-ios-bundle-identifier": this.bundleId
    };
    if (this.appcheckToken) {
      headers["X-Firebase-AppCheck"] = this.appcheckToken;
    }
    if (this.instanceIdToken) {
      headers["Firebase-Instance-Id-Token"] = this.instanceIdToken;
    }
    return headers;
  }

  setCustomDevice(options = {}) {
    this.autoEmulate = false;
    const {
      installationId = null,
      bundleId = null,
      hardwareModel = null,
      modelName = null,
      iosVersion = null,
      appVersion = null,
      buildNumber = null,
      customUserAgent = null,
      customAnalytics = null,
      appcheckToken = null,
      instanceIdToken = null
    } = options;
    if (installationId !== null) this.installationId = installationId;
    if (bundleId !== null) this.bundleId = bundleId;
    if (appVersion !== null) this.appVersion = appVersion;
    if (buildNumber !== null) this.buildNumber = buildNumber;
    if (iosVersion !== null) this.modelInfo.ios = iosVersion;
    if (modelName !== null) this.modelInfo.name = modelName;
    if (hardwareModel !== null) {
      this.modelInfo.model = hardwareModel;
      this.modelInfo.hw = hardwareModel.startsWith("hw/") ? hardwareModel : `hw/${hardwareModel}`;
    }
    if (customUserAgent !== null) this.customUserAgent = customUserAgent;
    if (customAnalytics !== null) this.customAnalytics = customAnalytics;
    if (appcheckToken !== null) this.appcheckToken = appcheckToken;
    if (instanceIdToken !== null) this.instanceIdToken = instanceIdToken;
  }

  enableAutoEmulation() {
    this.autoEmulate = true;
    this.customUserAgent = null;
    this.customAnalytics = null;
  }

  toDict() {
    return {
      auto_emulate: this.autoEmulate,
      installation_id: this.installationId,
      bundle_id: this.bundleId,
      app_version: this.appVersion,
      build_number: this.buildNumber,
      model_info: this.modelInfo,
      custom_user_agent: this.customUserAgent,
      custom_analytics: this.customAnalytics,
      appcheck_token: this.appcheckToken,
      instance_id_token: this.instanceIdToken
    };
  }

  static fromDict(data) {
    if (!data) return new DeviceProfile();
    const inst = new DeviceProfile({
      autoEmulate: data.auto_emulate !== undefined ? data.auto_emulate : true,
      installationId: data.installation_id,
      bundleId: data.bundle_id || "com.locket.Locket",
      appVersion: data.app_version || "2.68.0",
      buildNumber: data.build_number || "2523",
      customUserAgent: data.custom_user_agent,
      customAnalytics: data.custom_analytics,
      appcheckToken: data.appcheck_token,
      instanceIdToken: data.instance_id_token
    });
    if (data.model_info) inst.modelInfo = data.model_info;
    return inst;
  }
}

module.exports = { DeviceProfile };