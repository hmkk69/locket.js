const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

class ReactionEmoji {
  static YELLOW_HEART = "💛";
  static FIRE = "🔥";
  static HEART_EYES = "😍";
  static TWO_HEARTS = "💕";
  static SPARKLE_HEART = "💖";
  static SMILING_HEARTS = "🥰";
  static LAUGHING = "😂";
  static KISS = "💋";
  static HEART_HANDS = "🫶";
  static RED_HEART = "❤️";
  static DEFAULT_QUICK_REACTIONS = ["💛", "🔥", "😍", "💕"];
  static OFFICIAL_PALETTE = ["💛", "💖", "🥰", "😂", "🔥", "💋", "🫶", "❤️", "😍", "💕"];
}

class ChatModule {
  constructor(client) {
    this.client = client;
    this.ReactionEmoji = ReactionEmoji;
  }

  static getSupportedReactions() {
    return [...ReactionEmoji.OFFICIAL_PALETTE];
  }

  _getHistoryFile() {
    const baseDir = path.dirname(path.resolve(this.client.session.sessionPath || "locket.js_session.json"));
    return path.join(baseDir, "chat_history.json");
  }

  _loadHistory() {
    const hfile = this._getHistoryFile();
    if (fs.existsSync(hfile)) {
      try { return JSON.parse(fs.readFileSync(hfile, "utf-8")); } catch (e) { return {}; }
    }
    return {};
  }

  _saveHistory(history) {
    const hfile = this._getHistoryFile();
    try { fs.writeFileSync(hfile, JSON.stringify(history, null, 2), "utf-8"); } catch (e) {}
  }

  recordMessage(options) {
    const { conversationId, senderUid, receiverUid, text, messageId = null, clientToken = null, timestamp = null, reaction = null } = options;
    const history = this._loadHistory();
    const conv = history[conversationId] || (history[conversationId] = []);
    const ts = timestamp || new Date().toISOString();
    const entry = {
      conversation_id: conversationId,
      message_id: messageId,
      client_token: clientToken,
      sender_uid: senderUid,
      receiver_uid: receiverUid,
      is_me: senderUid === this.client.session.uid,
      text,
      has_reaction: Boolean(reaction),
      reaction,
      timestamp: ts
    };
    for (let i = 0; i < conv.length; i++) {
      const existing = conv[i];
      if ((clientToken && existing.client_token === clientToken) || (messageId && existing.message_id === messageId)) {
        conv[i] = { ...existing, ...entry };
        this._saveHistory(history);
        return conv[i];
      }
    }
    conv.push(entry);
    conv.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
    this._saveHistory(history);
    return entry;
  }

  async fetchMessagesFromServer(options = {}) {
    const { conversationId = null, otherUserId = null } = options;
    const token = this.client.session.idToken;
    const myUid = this.client.session.uid;
    if (!token) return [];

    let cid = conversationId;
    if (!cid && otherUserId) {
      try {
        const uUrl = `https://firestore.googleapis.com/v1/projects/locket-4252a/databases/(default)/documents/users/${myUid}/conversations`;
        const uRes = await fetch(uUrl, { headers: { Authorization: `Bearer ${token}` } });
        const uData = await uRes.json();
        for (const doc of (uData.documents || [])) {
          const cCandidate = doc.name.split("/").pop();
          const cUrl = `https://firestore.googleapis.com/v1/projects/locket-4252a/databases/(default)/documents/conversations/${cCandidate}`;
          const cRes = await fetch(cUrl, { headers: { Authorization: `Bearer ${token}` } });
          const cData = await cRes.json();
          const members = ((cData.fields && cData.fields.members && cData.fields.members.arrayValue && cData.fields.members.arrayValue.values) || []).map(v => v.stringValue);
          if (members.includes(otherUserId)) { cid = cCandidate; break; }
        }
      } catch (e) {}
    }
    if (!cid) return [];

    const url = `https://firestore.googleapis.com/v1/projects/locket-4252a/databases/(default)/documents/conversations/${cid}/messages`;
    let data;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      data = await res.json();
    } catch (e) { return []; }

    const serverMessages = [];
    for (const doc of (data.documents || [])) {
      const fields = doc.fields || {};
      const docId = doc.name.split("/").pop();
      const sender = (fields.sender && fields.sender.stringValue) || "";
      const body = (fields.body && fields.body.stringValue) || "";
      const createdAt = (fields.created_at && fields.created_at.timestampValue) || "";
      const clientToken = (fields.client_token && fields.client_token.stringValue) || null;

      const reactionsList = [];
      if (fields.reactions) {
        for (const r of (fields.reactions.arrayValue && fields.reactions.arrayValue.values) || []) {
          const rf = (r.mapValue && r.mapValue.fields) || {};
          reactionsList.push({
            sender: (rf.sender && rf.sender.stringValue) || null,
            emoji: (rf.emoji && rf.emoji.stringValue) || null,
            created_at: (rf.created_at && rf.created_at.timestampValue) || null
          });
        }
      }

      const isMe = sender === myUid;
      const msgObj = {
        conversation_id: cid,
        message_id: docId,
        client_token: clientToken,
        sender_uid: sender,
        receiver_uid: otherUserId ? otherUserId : (isMe ? null : myUid),
        is_me: isMe,
        text: body,
        has_reaction: reactionsList.length > 0,
        reaction: reactionsList.length ? reactionsList[0].emoji : null,
        reactions: reactionsList,
        timestamp: createdAt
      };
      serverMessages.push(msgObj);
      this.recordMessage({
        conversationId: cid,
        senderUid: sender,
        receiverUid: msgObj.receiver_uid,
        text: body,
        messageId: docId,
        clientToken,
        reaction: msgObj.reaction
      });
    }
    serverMessages.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
    return serverMessages;
  }

  async getMessages(options = {}) {
    const { otherUserId = null, conversationId = null, fetchServer = true } = options;
    if (fetchServer) {
      const serverMsgs = await this.fetchMessagesFromServer({ conversationId, otherUserId });
      if (serverMsgs && serverMsgs.length) return serverMsgs;
    }
    const history = this._loadHistory();
    const myUid = this.client.session.uid;
    const matched = [];
    for (const [cid, msgs] of Object.entries(history)) {
      if (conversationId && cid !== conversationId) continue;
      for (const m of msgs) {
        if (otherUserId) {
          if (m.sender_uid === otherUserId || m.receiver_uid === otherUserId) matched.push(m);
        } else {
          matched.push(m);
        }
      }
    }
    matched.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
    return matched;
  }

  async sendMessage(options) {
    const { receiverUid, text = null, momentUid = null } = options;
    const token = randomUUID().toUpperCase();
    const msgText = (text !== null && text !== "") ? text : (momentUid ? "\u200b" : "");
    const payload = {
      receiver_uid: receiverUid,
      msg: msgText,
      moment_uid: momentUid,
      from_memory: false,
      intensity: { value: "0", "@type": "type.googleapis.com/google.protobuf.Int64Value" },
      client_token: token
    };
    const res = await this.client.postApi("sendChatMessageV2", payload);
    const convUid = res && res.data && res.data.conversation_uid;
    if (convUid) {
      this.recordMessage({
        conversationId: convUid,
        senderUid: this.client.session.uid,
        receiverUid,
        text: text || "",
        clientToken: token
      });
    }
    const dataRes = (res && res.data) ? res.data : res;
    if (dataRes && typeof dataRes === "object" && !dataRes.msg_id) {
      dataRes.msg_id = token;
      dataRes.client_token = token;
    }
    return dataRes;
  }

  async sendMoment(receiverUid, momentUid, text = null) {
    return this.sendMessage({ receiverUid, text, momentUid });
  }

  async deleteMessage(conversationUid, messageUid, validateOwnership = true) {
    if (validateOwnership) {
      const history = this._loadHistory();
      const conv = history[conversationUid] || [];
      for (const m of conv) {
        if ((m.message_id === messageUid || m.client_token === messageUid) && !m.is_me) {
          throw new Error(`Cannot recall/delete message (${messageUid}) because it was sent by someone else. You can only recall your own messages.`);
        }
      }
    }
    const payload = { conversation_uid: conversationUid, message_uid: messageUid };
    const res = await this.client.postApi("deleteChatMessage", payload);
    if (res && res.status === 200) {
      const history = this._loadHistory();
      if (history[conversationUid]) {
        history[conversationUid] = history[conversationUid].filter(m => m.message_id !== messageUid && m.client_token !== messageUid);
        this._saveHistory(history);
      }
    }
    return res;
  }

  async sendReaction(conversationId, messageId, emoji, validateReceiver = true) {
    if (validateReceiver) {
      const history = this._loadHistory();
      const conv = history[conversationId] || [];
      for (const m of conv) {
        if (m.message_id === messageId && m.is_me) {
          throw new Error(`Cannot react to your own message (${messageId}). Locket only allows reactions on friend's messages.`);
        }
      }
    }
    const payload = { conversation_id: conversationId, message_id: messageId, emoji };
    const res = await this.client.postApi("sendChatMessageReaction", payload);
    if (res && res.status === 200) {
      const history = this._loadHistory();
      if (history[conversationId]) {
        for (const m of history[conversationId]) {
          if (m.message_id === messageId) { m.reaction = emoji; m.has_reaction = true; }
        }
        this._saveHistory(history);
      }
    }
    return res;
  }

  async removeReaction(conversationId, messageId) {
    const payload = { conversation_id: conversationId, message_id: messageId };
    const res = await this.client.postApi("removeChatMessageReaction", payload);
    if (res && res.status === 200) {
      const history = this._loadHistory();
      if (history[conversationId]) {
        for (const m of history[conversationId]) {
          if (m.message_id === messageId) { m.reaction = null; m.has_reaction = false; }
        }
        this._saveHistory(history);
      }
    }
    return res;
  }

  async markAsRead(options = {}) {
    const { conversationUid = null, otherUserId = null, sendReadReceipt = true } = options;
    const payload = { send_read_receipt: Boolean(sendReadReceipt) };
    if (conversationUid) payload.conversation_uid = conversationUid;
    if (otherUserId) payload.other_user_id = otherUserId;
    return this.client.postApi("markAsRead", payload);
  }

  async getConversations() {
    const token = this.client.session.idToken;
    const myUid = this.client.session.uid;
    if (!token) return [];
    const url = `https://firestore.googleapis.com/v1/projects/locket-4252a/databases/(default)/documents/users/${myUid}/conversations`;
    let data;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      data = await res.json();
    } catch (e) { return []; }

    const conversations = [];
    for (const doc of (data.documents || [])) {
      const fields = doc.fields || {};
      const cid = doc.name.split("/").pop();
      const members = ((fields.members && fields.members.arrayValue && fields.members.arrayValue.values) || []).map(v => v.stringValue);
      const otherUid = members.filter(m => m !== myUid)[0] || null;
      const latestMsgField = (fields.latest_message && fields.latest_message.mapValue && fields.latest_message.mapValue.fields) || {};
      const latestBody = (latestMsgField.body && latestMsgField.body.stringValue) || null;
      const latestSender = (latestMsgField.sender && latestMsgField.sender.stringValue) || null;
      const latestTime = (latestMsgField.created_at && latestMsgField.created_at.timestampValue) || null;
      const unreadCount = parseInt((fields.unread_count && fields.unread_count.integerValue) || 0);
      const isRead = (fields.is_read && fields.is_read.booleanValue) !== false;
      const otherReadTime = (fields.other_last_read_at && fields.other_last_read_at.timestampValue) || null;
      conversations.push({
        conversation_id: cid,
        peer_uid: otherUid,
        members,
        unread_count: unreadCount,
        is_read: isRead,
        other_last_read_at: otherReadTime,
        latest_message: { text: latestBody, sender_uid: latestSender, timestamp: latestTime }
      });
    }
    return conversations;
  }

  async listenRealtime(otherUserId, onMessage) {
    let WebSocket;
    try { WebSocket = require("ws"); } catch (e) {
      throw new Error("The 'ws' package is required for real-time streaming. Install it using: npm install ws");
    }
    const token = await this.client.session.getValidToken();
    const myUid = this.client.session.uid;

    let targetUid = otherUserId;
    if (otherUserId && !/[A-Z]/.test(otherUserId) && otherUserId.length < 28) {
      try {
        const prof = await this.client.user.getProfileByUsername(otherUserId);
        if (prof && prof.uid) targetUid = prof.uid;
      } catch (e) {}
    }

    const wsUrl = `wss://api.locketcamera.com/wss_v2/chat?otherUserId=${targetUid}&userId=${myUid}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      "User-Agent": this.client.device.userAgent,
      "x-ios-bundle-identifier": this.client.device.bundleId
    };

    const ws = new WebSocket(wsUrl, { headers });
    ws.on("message", (raw) => {
      let data;
      try { data = JSON.parse(raw.toString()); } catch (e) { data = raw.toString(); }
      if (typeof onMessage === "function") {
        const r = onMessage(data);
        if (r && typeof r.then === "function") r.catch(() => {});
      }
    });
    return ws;
  }
}

module.exports = { ChatModule, ReactionEmoji };