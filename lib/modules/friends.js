const { LocketError } = require("../exceptions");

class FriendsModule {
  constructor(client) {
    this.client = client;
  }

  async getGroupsAndFriends() {
    const res = await this.client.postApi("getGroupsState", {});
    return (res && res.data) ? res.data : res;
  }

  async getAllFriends() {
    const token = await this.client.session.getValidToken();
    const myUid = this.client.session.uid;
    const url = `https://firestore.googleapis.com/v1/projects/locket-4252a/databases/(default)/documents/users/${myUid}/friends`;
    const req = { headers: { Authorization: `Bearer ${token}` } };
    let friends = [];
    try {
      const res = await fetch(url, req);
      const data = await res.json();
      for (const doc of (data.documents || [])) {
        const fuid = doc.name.split("/").pop();
        try {
          const profile = await this.client.user.getProfile(fuid);
          friends.push(profile);
        } catch (e) {
          friends.push({ uid: fuid });
        }
      }
    } catch (e) {}
    return friends;
  }

  async getFriendRequests() {
    const token = await this.client.session.getValidToken();
    const myUid = this.client.session.uid;
    const base = `https://firestore.googleapis.com/v1/projects/locket-4252a/databases/(default)/documents/users/${myUid}`;
    const headers = { Authorization: `Bearer ${token}` };
    const res = { incoming: [], outgoing: [] };
    for (const reqType of ["incoming_friend_requests", "outgoing_friend_requests"]) {
      const key = reqType.includes("incoming") ? "incoming" : "outgoing";
      try {
        const url = `${base}/${reqType}`;
        const r = await fetch(url, { headers });
        const data = await r.json();
        for (const doc of (data.documents || [])) {
          const fuid = doc.name.split("/").pop();
          try {
            const p = await this.client.user.getProfile(fuid);
            res[key].push(p);
          } catch (e) {
            res[key].push({ uid: fuid });
          }
        }
      } catch (e) {}
    }
    return res;
  }

  async resolveInviteTokenFromUsername(username) {
    const url = `https://locket.cam/${username}`;
    try {
      const r = await fetch(url, { headers: { "User-Agent": "com.locket.Locket/2.68.0 iPhone/27.0" } });
      const html = await r.text();
      let m = html.match(/locket\.camera%2Finvites%2F([a-zA-Z0-9]+)/);
      if (!m) m = html.match(/locket\.camera\/invites\/([a-zA-Z0-9]+)/);
      if (m) return m[1];
    } catch (e) {}
    return null;
  }

  async fetchUserByInviteToken(inviteToken) {
    const res = await this.client.postApi("fetchUserForInviteToken", { invite_token: inviteToken });
    return (res && res.data) ? res.data : res;
  }

  async sendRequest(userUid, source = "inviteCardPopup") {
    const payload = {
      user_uid: userUid,
      source,
      platform: "iOS",
      create_ofr_for_temp_users: false,
      share_history_eligible: true,
      get_reengagement_status: false,
      prompted_reengagement: false,
      rollcall: false,
      invite_variant: { value: "1002", "@type": "type.googleapis.com/google.protobuf.Int64Value" }
    };
    return this.client.postApi("sendFriendRequest", payload);
  }

  async sendRequestByUsername(username) {
    const token = await this.resolveInviteTokenFromUsername(username);
    if (token) {
      const userData = await this.fetchUserByInviteToken(token);
      const uid = (userData && userData.user && userData.user.uid) ? userData.user.uid : null;
      if (uid) return this.sendRequest(uid);
    }
    const profile = await this.client.user.getProfileByUsername(username);
    if (profile && profile.uid) return this.sendRequest(profile.uid);
    throw new Error(`User not found for username: ${username}`);
  }

  async acceptRequest(userUid) {
    const payload = {
      user_uid: userUid,
      during_signup: false,
      ios_version: `${this.client.device.appVersion}.${this.client.device.buildNumber}`
    };
    const res = await this.client.postApi("acceptFriendRequest", payload);
    return (res && res.data) ? res.data : res;
  }

  _resolveTargetUid(userOrUid) {
    const clean = String(userOrUid).trim().replace(/^@/, "");
    if (clean.length === 28 && /^[a-zA-Z0-9]+$/.test(clean) && !/^[a-zA-Z]+$/.test(clean) && !/^[0-9]+$/.test(clean)) {
      return clean;
    }
    try {
      const profile = this.client.user.getProfileByUsername(clean);
      if (profile && profile.uid) return profile.uid;
    } catch (e) {}
    return clean;
  }

  async remove(userUid) {
    const targetUid = this._resolveTargetUid(userUid);
    return this.client.postApi("removeFriend", { user_uid: targetUid });
  }

  async block(userUid) {
    const targetUid = this._resolveTargetUid(userUid);
    return this.client.postApi("blockFriend", { user_uid: targetUid });
  }

  async unblock(userUid) {
    const targetUid = this._resolveTargetUid(userUid);
    return this.client.postApi("unblockUser", { user_uid: targetUid });
  }

  async suggestFriends(phoneContacts = null) {
    const payload = {
      contacts: phoneContacts || [],
      smart_friend_suggestions: { "@type": "type.googleapis.com/google.protobuf.Int64Value", value: "0" }
    };
    const res = await this.client.postApi("suggestFriends", payload);
    return (res && res.data) ? res.data : res;
  }
}

module.exports = { FriendsModule };