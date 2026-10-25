const fs = require("fs");

let sharp = null;
try { sharp = require("sharp"); } catch (e) { sharp = null; }

class UserModule {
  constructor(client) {
    this.client = client;
  }

  async getProfile(userUid = null) {
    const target = userUid || this.client.session.uid;
    const res = await this.client.postApi("fetchUserV2", { user_uid: target });
    const profile = (res && res.data) ? res.data : res;

    if (!userUid || userUid === this.client.session.uid) {
      try {
        const token = await this.client.session.getValidToken();
        const lookupUrl = `${this.client.session.constructor.FIREBASE_AUTH_URL}:lookup?key=${this.client.session.constructor.FIREBASE_API_KEY}`;
        const headers = {
          "User-Agent": this.client.device.userAgent,
          "X-Ios-Bundle-Identifier": this.client.device.bundleId,
          "Content-Type": "application/json"
        };
        const fbRes = await fetch(lookupUrl, { method: "POST", headers, body: JSON.stringify({ idToken: token }) });
        if (fbRes.status === 200) {
          const fbData = await fbRes.json();
          const fbUsers = fbData.users || [];
          if (fbUsers.length) {
            const fbU = fbUsers[0];
            if (fbU.photoUrl) profile.profile_picture_url = fbU.photoUrl;
            if (fbU.email) profile.email = fbU.email;
          }
        }
      } catch (e) {}
    }
    return profile;
  }

  async getProfileByUsername(username) {
    const token = await this.client.friends.resolveInviteTokenFromUsername(username);
    if (token) {
      const res = await this.client.friends.fetchUserByInviteToken(token);
      return (res && res.user) ? res.user : res;
    }
    return { error: "User not found or unable to resolve username link" };
  }

  async updateProfile(kwargs) {
    return this.client.postApi("changeProfileInfo", kwargs);
  }

  async updateName(firstName, lastName) {
    return this.updateProfile({ first_name: firstName, last_name: lastName });
  }

  async updateBirthdate(birthdate) {
    return this.updateProfile({ birthdate });
  }

  async updateAvatar(imageOrUrl) {
    let imageUrl = imageOrUrl;
    if (!(typeof imageOrUrl === "string" && imageOrUrl.startsWith("http"))) {
      imageUrl = await this.uploadAvatar(imageOrUrl);
    }

    const token = await this.client.session.getValidToken();
    const url = `${this.client.session.constructor.FIREBASE_AUTH_URL}:update?key=${this.client.session.constructor.FIREBASE_API_KEY}`;
    const headers = {
      "User-Agent": this.client.device.userAgent,
      "X-Ios-Bundle-Identifier": this.client.device.bundleId,
      "Content-Type": "application/json"
    };
    const payload = { idToken: token, photoUrl: imageUrl, returnSecureToken: true };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    if (res.status === 200) {
      const data = await res.json();
      this.client.session.idToken = data.idToken || token;
      this.client.session.refreshToken = data.refreshToken || this.client.session.refreshToken;
      this.client.session.save();
      return { status: 200, profile_picture_url: imageUrl, user: data };
    }
    return { status: res.status, profile_picture_url: imageUrl, error: await res.text() };
  }

  async uploadAvatar(filePathOrBytes) {
    let rawBytes;
    if (typeof filePathOrBytes === "string") {
      rawBytes = fs.readFileSync(filePathOrBytes);
    } else {
      rawBytes = filePathOrBytes;
    }
    let webpBuffer;
    if (sharp) {
      let img = sharp(rawBytes);
      const meta = await img.metadata();
      if (meta.hasAlpha) img = img.toFormat("webp", { quality: 85 });
      else img = img.toFormat("webp", { quality: 85 });
      webpBuffer = await img.toBuffer();
    } else {
      webpBuffer = Buffer.from(rawBytes);
    }

    const userUid = this.client.session.uid;
    const token = await this.client.session.getValidToken();
    const url = `https://firebasestorage.googleapis.com/v0/b/locket-img/o/users%2F${userUid}%2Fpublic%2Fprofile_pic.webp`;
    const headers = {
      Authorization: `Firebase ${token}`,
      "Content-Type": "image/webp",
      "x-firebase-storage-version": "ios/12.12.1",
      "x-firebase-gmpid": this.client.session.constructor.FIREBASE_APP_ID,
      "User-Agent": `${this.client.device.userAgent} (GTMSUF/1)`
    };
    const res = await fetch(url, { method: "POST", headers, body: webpBuffer });
    if (res.status !== 200) throw new Error(`Avatar upload failed (${res.status}): ${await res.text()}`);
    const meta = await res.json();
    const dlToken = meta.downloadTokens || "";
    return `https://firebasestorage.googleapis.com:443/v0/b/locket-img/o/users%2F${userUid}%2Fpublic%2Fprofile_pic.webp?alt=media&token=${dlToken}`;
  }

  async syncClientData(options = {}) {
    const { pushNotifications = true, autoSync = true, extraData = null } = options;
    let data;
    if (autoSync) {
      data = {
        ios_version: `${this.client.device.appVersion}.${this.client.device.buildNumber}`,
        push_notifications_enabled: pushNotifications
      };
    } else {
      data = { push_notifications_enabled: pushNotifications };
    }
    if (extraData) Object.assign(data, extraData);
    return this.client.postApi("setClientData", { client_data: data });
  }

  async setNotificationToken(options = {}) {
    const { fcmToken = null, autoFake = true } = options;
    const crypto = require("crypto");
    let token = "";
    if (!autoFake) {
      token = fcmToken || "";
    } else {
      if (fcmToken) {
        token = fcmToken;
      } else {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
        let suffix = "";
        for (let i = 0; i < 140; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
        token = `${this.client.device.installationId}:APA91b${suffix}`;
      }
    }
    const payload = {
      app: "locket",
      installation_id: this.client.device.installationId,
      notification_token: token
    };
    return this.client.postApi("setNotificationToken", payload);
  }
}

module.exports = { UserModule };