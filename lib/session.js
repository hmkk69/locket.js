const fs = require("fs");
const path = require("path");
const { AuthenticationError } = require("./exceptions");
const { DeviceProfile } = require("./device");

class SessionManager {
  static FIREBASE_API_KEY = "AIzaSyCQngaaXQIfJaH0aS2l7REgIjD7nL431So";
  static FIREBASE_AUTH_URL = "https://identitytoolkit.googleapis.com/v1/accounts";
  static FIREBASE_TOKEN_URL = "https://securetoken.googleapis.com/v1/token";
  static FIREBASE_APP_ID = "1:641029076083:ios:cc8eb46290d69b234fa606";

  constructor(options = {}) {
    const { sessionPath = "locket.js_session.json", device = null } = options;
    this.sessionPath = sessionPath;
    this.device = device || new DeviceProfile();
    this.uid = null;
    this.email = null;
    this.idToken = null;
    this.refreshToken = null;
    this.expiresAt = 0;
    this.load();
  }

  load() {
    if (!this.sessionPath || !fs.existsSync(this.sessionPath)) return false;
    try {
      const data = JSON.parse(fs.readFileSync(this.sessionPath, "utf-8"));
      this.uid = data.uid || null;
      this.email = data.email || null;
      this.idToken = data.idToken || null;
      this.refreshToken = data.refreshToken || null;
      this.expiresAt = data.expiresAt || 0;
      if (data.device) this.device = DeviceProfile.fromDict(data.device);
      return true;
    } catch (e) {
      return false;
    }
  }

  save() {
    if (!this.sessionPath) return;
    const data = {
      uid: this.uid,
      email: this.email,
      idToken: this.idToken,
      refreshToken: this.refreshToken,
      expiresAt: this.expiresAt,
      device: this.device.toDict()
    };
    try {
      const dir = path.dirname(this.sessionPath);
      if (dir && dir !== "." && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.sessionPath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {}
  }

  async login(email, password) {
    const url = `${this.constructor.FIREBASE_AUTH_URL}:signInWithPassword?key=${this.constructor.FIREBASE_API_KEY}`;
    const headers = this.device.defaultHeaders;
    const payload = { email, password, returnSecureToken: true };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    const data = await res.json();
    if (res.status !== 200) {
      const err = (data.error && data.error.message) || "Authentication failed";
      throw new AuthenticationError(`Login failed: ${err}`);
    }
    this.uid = data.localId;
    this.email = data.email;
    this.idToken = data.idToken;
    this.refreshToken = data.refreshToken;
    this.expiresAt = Date.now() + parseInt(data.expiresIn) * 1000;
    this.save();
    return data;
  }

  async refresh() {
    if (!this.refreshToken) throw new AuthenticationError("No refresh token available to renew session!");
    const url = `${this.constructor.FIREBASE_TOKEN_URL}?key=${this.constructor.FIREBASE_API_KEY}`;
    const headers = {
      "User-Agent": this.device.userAgent,
      "X-Ios-Bundle-Identifier": this.device.bundleId,
      "Content-Type": "application/x-www-form-urlencoded"
    };
    const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: this.refreshToken }).toString();
    const res = await fetch(url, { method: "POST", headers, body });
    const resData = await res.json();
    if (res.status !== 200) {
      const err = (resData.error && resData.error.message) || "Token renewal failed";
      throw new AuthenticationError(`Token refresh failed: ${err}`);
    }
    this.idToken = resData.id_token;
    this.refreshToken = resData.refresh_token;
    this.expiresAt = Date.now() + parseInt(resData.expires_in) * 1000;
    this.save();
  }

  async getValidToken() {
    if (!this.idToken) throw new AuthenticationError("Not authenticated! Please call login() first.");
    const nowMs = Date.now();
    if (nowMs >= (this.expiresAt - 60000)) {
      await this.refresh();
    }
    return this.idToken;
  }
}

module.exports = { SessionManager };