const { DeviceProfile } = require("./device");
const { SessionManager } = require("./session");
const { UserModule } = require("./modules/user");
const { MomentsModule } = require("./modules/moments");
const { FriendsModule } = require("./modules/friends");
const { ChatModule } = require("./modules/chat");
const { LocketAPIError } = require("./exceptions");
const { fetchWithTimeout } = require("./http");

class LocketClient {
  static API_BASE = "https://api.locketcamera.com";

  constructor(options = {}) {
    const { sessionPath = "locket.js_session.json", device = null, autoEmulate = true, ...deviceKwargs } = options;
    if (device !== null) {
      this.device = device;
    } else if (!autoEmulate || Object.keys(deviceKwargs).length) {
      this.device = new DeviceProfile({ autoEmulate, ...deviceKwargs });
    } else {
      this.device = new DeviceProfile({ autoEmulate: true });
    }
    this.session = new SessionManager({ sessionPath, device: this.device });

    this.user = new UserModule(this);
    this.moments = new MomentsModule(this);
    this.friends = new FriendsModule(this);
    this.chat = new ChatModule(this);
  }

  setDevice(options = {}) {
    const { autoEmulate = true, ...rest } = options;
    if (autoEmulate) {
      this.device.enableAutoEmulation();
    } else {
      this.device.setCustomDevice(rest);
    }
    this.session.save();
  }

  isAuthenticated() {
    return Boolean(this.session.idToken && this.session.uid);
  }

  async login(email, password) {
    return this.session.login(email, password);
  }

  async postApi(endpoint, payload = null, options = {}) {
    const { timeoutMs = 30000 } = options || {};
    const token = await this.session.getValidToken();
    const url = `${LocketClient.API_BASE}/${endpoint}`;
    const headers = {
      ...this.device.defaultHeaders,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8"
    };
    const body = {
      data: {
        ...(payload || {}),
        analytics: this.device.analyticsData
      }
    };

    let res;
    try {
      res = await fetchWithTimeout(url, { method: "POST", headers, body: JSON.stringify(body) }, timeoutMs);
    } catch (e) {
      throw new LocketAPIError(`Network request failed for ${endpoint}: ${e && e.message ? e.message : e}`, null, null);
    }

    let data;
    try { data = await res.json(); } catch (e) { data = { status: res.status, error: res.statusText }; }

    if (!res.ok) {
      const errMsg = (data && (data.error || data.errors || data.message)) || res.statusText || `HTTP ${res.status}`;
      throw new LocketAPIError(`API request to ${endpoint} failed: ${errMsg}`, res.status, data);
    }
    if (data && (data.error || data.errors)) {
      const errMsg = data.error || data.errors;
      throw new LocketAPIError(`API request to ${endpoint} failed: ${errMsg}`, (data && data.status) || res.status, data);
    }
    return (data && data.result) ? data.result : data;
  }
}

module.exports = { LocketClient };