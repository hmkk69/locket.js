# locket.js - The unofficial Node.js SDK for Locket Camera

<p align="center">
  <b>Unofficial Node.js SDK for the Locket Camera backend</b><br>
  Interact with Locket accounts programmatically - moments, chat, friends, profiles - in pure JavaScript.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/locket.js"><img src="https://img.shields.io/npm/v/locket.js.svg?style=flat-square&color=blue" alt="npm Version"></a>
  <a href="https://www.npmjs.com/package/locket.js"><img src="https://img.shields.io/node/v/locket.js.svg?style=flat-square" alt="Node Version"></a>
  <a href="https://github.com/hmk8386/locket.js/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-PolyForm--Noncommercial--1.0.0-blue.svg?style=flat-square" alt="License: PolyForm Noncommercial 1.0.0"></a>
  <a href="https://www.npmjs.com/package/locket.js"><img src="https://img.shields.io/npm/dm/locket.js.svg?style=flat-square" alt="Downloads"></a>
  <a href="README_VI.md"><img src="https://img.shields.io/badge/Language-Vietnamese-red.svg?style=flat-square" alt="Vietnamese Docs"></a>
</p>

---

## Documentation

| Document | Description |
|:---|:---|
| [README.md](README.md) | Overview, installation & quick start (you are here) |
| [README_VI.md](README_VI.md) | This page in Vietnamese |
| [docs/INTEGRATION.md](docs/INTEGRATION.md) · [VI](docs/INTEGRATION_VI.md) | Step-by-step integration guide |
| [docs/FEATURES.md](docs/FEATURES.md) · [VI](docs/FEATURES_VI.md) | Full API catalog - every class, method and parameter |

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [API reference](#api-reference)
  - [1. Authentication & sessions](#1-authentication--sessions)
  - [2. User profile](#2-user-profile)
  - [3. Moments (feed & uploads)](#3-moments-feed--uploads)
  - [4. Friends, groups & blocking](#4-friends-groups--blocking)
  - [5. Chat & real-time WebSockets](#5-chat--real-time-websockets)
  - [6. Device profile customization](#6-device-profile-customization)
  - [7. Error handling](#7-error-handling)
- [Project structure](#project-structure)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Disclaimer](#disclaimer)

---

## Overview

**`locket.js`** is a reverse-engineered Node.js SDK that provides direct programmatic access to the Locket Camera backend. It allows developers, bot creators, and automation engineers to interact with Locket accounts from Node.js - without an iOS device.

> **Status:** pre-1.0 (`0.0.x`). APIs may change between minor versions. See [Disclaimer](#disclaimer).

## Features

- **Authentic iOS emulation** - real iPhone hardware identifiers (iPhone 13 Pro → iPhone 15 Pro Max), bundle ID (`com.locket.Locket`), Firebase GMPID and Protobuf analytics payloads.
- **Autonomous token renewal** - Firebase JWT `idToken` is refreshed automatically in the background before expiry.
- **Smart media pipeline** - images are converted to Locket-optimized `.webp` via [`sharp`](https://sharp.pixelplumbing.com/) and uploaded through Google Cloud Storage Resumable protocol. Videos are auto-compressed to HEVC < 6 MB.
- **Real-time chat** - live message listener over `wss://api.locketcamera.com/wss_v2/chat` with auto-reconnect.
- **158+ caption presets** - gradient pill badges via `NoteType` and `caption_presets.json`, plus custom icons and colors.
- **Typed errors** - `AuthenticationError`, `StorageUploadError`, `LocketAPIError` for predictable failure handling.

## Installation

```bash
npm install locket.js
```

Install from source:

```bash
git clone https://github.com/hmk8386/locket.js.git
cd locket.js
npm install
```

Requires **Node.js >= 18**. `sharp` is required for image processing; `ws` is required only for real-time chat.

## Quick start

```js
const { LocketClient } = require("locket.js");

(async () => {
  // 1. Initialize the client (auto-loads locket.js_session.json if present)
  const client = new LocketClient({ sessionPath: "locket.js_session.json" });

  // 2. Authenticate (first run only - the session is persisted to disk)
  if (!client.isAuthenticated()) {
    await client.login("you@example.com", "your_password");
  }

  // 3. Fetch your profile
  const profile = await client.user.getProfile();
  console.log(`Signed in as ${profile.first_name} ${profile.last_name} (@${profile.username})`);

  // 4. Post a photo moment
  const moment = await client.moments.post({
    image: "daily_snapshot.jpg",
    caption: "Captured with locket.js ✨",
    isPrivate: false,
  });
  console.log("Moment posted:", moment.canonical_uid);
})().catch(console.error);
```

## API reference

All methods return Promises. The client exposes four feature modules: `client.user`, `client.moments`, `client.friends`, `client.chat`.

### 1. Authentication & sessions

`SessionManager` handles credentials, persisted sessions and JWT lifecycle.

```js
const client = new LocketClient({ sessionPath: "locket.js_session.json" });

// Login with email and password
await client.login("you@example.com", "your_password");

// Check authentication state
if (client.isAuthenticated()) {
  console.log("UID:", client.session.uid);
}

// Force a manual token refresh (normally automatic)
await client.session.refresh();
```

Sessions are stored as JSON on disk (`0600` permissions on non-Windows) and include the device profile, so subsequent runs skip login entirely.

### 2. User profile

Access via `client.user`.

```js
// Get your own profile, or another user's by UID
const me = await client.user.getProfile();
const other = await client.user.getProfile("TARGET_USER_UID");

// Update display name / birthdate (YYYY-MM-DD)
await client.user.updateName("Lam", "Dev");
await client.user.updateBirthdate("2006-04-21");

// Update avatar (local file path/bytes, or a Firebase Storage URL)
await client.user.updateAvatar("avatar.jpg");

// Sync client data (app version, push notifications)
await client.user.syncClientData({ pushNotifications: true });
```

### 3. Moments (feed & uploads)

Access via `client.moments`. `NoteType` exposes the caption pill presets.

```js
const { LocketClient, NoteType } = require("locket.js");

// Post a photo moment with a preset gradient pill caption
await client.moments.post({
  image: "photo.jpg",                        // path, Buffer, or Storage URL
  noteType: NoteType.FLEX_DEN_HOI_THO_CUOI,  // preset pill badge
  isPrivate: false,                          // true = sent to self only
  recipients: null,                          // UIDs of specific friends, or null for all
});

// Post with a custom caption, emoji and gradient colors
await client.moments.post({
  image: "photo.jpg",
  caption: "Coding with AI",
  icon: "⚡",
  colors: ["#FF416C", "#8A2387"],
});

// Post a video moment (auto-compressed to HEVC < 6 MB)
await client.moments.post({
  video: "clip.mp4",                         // thumbnail is extracted automatically
  noteType: NoteType.MUSIC,
});

// Paginated moment history (cursor-based)
const { moments, nextPageToken } = await client.moments.getMoments({ limit: 20 });

// Fetch a friend's latest shared moments
const friendMoments = await client.moments.getSharedMomentsByUsername("friend_username", 10);

// React, comment, mark viewed, delete
await client.moments.react(momentUid, "❤️");
await client.moments.comment(momentUid, friendUid, "Great shot!");
await client.moments.markAsViewed(momentUid);
await client.moments.delete(momentUid);

// View count & viewers
const views = await client.moments.getViews(momentUid);

// Latest feed from friends
const feed = await client.moments.getLatest();
```

### 4. Friends, groups & blocking

Access via `client.friends`.

```js
// All friends with full profile details
const friends = await client.friends.getAllFriends();

// Groups state
const groups = await client.friends.getGroupsAndFriends();

// Resolve a username (locket.cam/<username>) to an invite token / UID
const token = await client.friends.resolveInviteTokenFromUsername("friend_username");

// Send / accept friend requests
await client.friends.sendRequestByUsername("friend_username");
await client.friends.acceptRequest("TARGET_USER_UID");

// Remove, block & unblock (accepts UID or @username)
await client.friends.remove("TARGET_USER_UID");
await client.friends.block("TARGET_USER_UID");
await client.friends.unblock("TARGET_USER_UID");
```

### 5. Chat & real-time WebSockets

Access via `client.chat`. Real-time streaming requires the `ws` package.

```js
// Send a direct message
await client.chat.sendMessage({ receiverUid: "FRIEND_UID", text: "Hey! ❤️" });

// Share a moment into chat (optionally with text)
await client.chat.sendMoment("FRIEND_UID", "MOMENT_UID", "Check this out!");

// Inbox & message history
const conversations = await client.chat.getConversations();
const messages = await client.chat.getMessages({ otherUserId: "FRIEND_UID" });

// React with a single or multi-emoji combo; remove a reaction
await client.chat.sendReaction(conversationId, messageId, "❤️");
await client.chat.sendReaction(conversationId, messageId, "🔥🥰");
await client.chat.removeReaction(conversationId, messageId);

// Recall your own message
await client.chat.deleteMessage(conversationUid, messageUid);

// Mark as read (set sendReadReceipt: false for ghost mode)
await client.chat.markAsRead({ conversationUid, sendReadReceipt: true });

// Listen for live incoming messages (auto-reconnects)
await client.chat.listenRealtime("FRIEND_UID", (msg) => {
  console.log("New message:", msg);
});
```

### 6. Device profile customization

By default the client emulates a random modern iPhone. Pass a custom `DeviceProfile` for full control:

```js
const { LocketClient, DeviceProfile } = require("locket.js");

const device = new DeviceProfile({
  modelName: "iPhone 15 Pro",
  hardwareModel: "iPhone16,1",
  iosVersion: "18.1.0",
  appVersion: "2.68.0",
  buildNumber: "2523",
});

const client = new LocketClient({ sessionPath: "session.json", device });
console.log("Emulating:", device.userAgent);
```

### 7. Error handling

All custom errors extend `LocketError`:

```js
const {
  LocketError,
  AuthenticationError,
  LocketAPIError,
  StorageUploadError,
} = require("locket.js");

try {
  await client.login("you@example.com", "wrong_password");
} catch (err) {
  if (err instanceof AuthenticationError) {
    console.error("Login failed:", err.message);
  } else if (err instanceof LocketAPIError) {
    console.error(`API error (HTTP ${err.statusCode}):`, err.message);
  } else if (err instanceof StorageUploadError) {
    console.error("Media upload failed:", err.message);
  } else {
    throw err;
  }
}
```

## Project structure

```
locket.js/
├── index.js              # Public entry point (CommonJS exports)
├── index.d.ts            # TypeScript declarations
├── caption_presets.json  # NoteType gradient pill presets
├── lib/
│   ├── client.js         # LocketClient - API base, postApi(), wiring
│   ├── session.js        # SessionManager - Firebase auth, token refresh, persistence
│   ├── device.js         # DeviceProfile - iPhone hardware/analytics emulation
│   ├── http.js           # fetchWithTimeout helper
│   ├── exceptions.js     # LocketError hierarchy
│   └── modules/
│       ├── user.js       # Profile, avatar upload, client data
│       ├── moments.js    # Post/feed/reactions/comments/pagination
│       ├── friends.js    # Friends, groups, requests, blocking
│       └── chat.js       # Messages, reactions, real-time WebSocket
├── docs/                 # Integration guide & full API catalog (EN/VI)
└── tests/                # node:test unit tests
```

## Testing

```bash
npm test     # node --test tests/*.js
npm run lint # syntax-check index.js and lib/
```

## Contributing

Contributions, bug reports and feature requests are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Special thanks to [@huuhieu17](https://github.com/huuhieu17) for paginated `getMoments()` support.

## License

Copyright © 2026 **Hmk8386**. Distributed under the [PolyForm Noncommercial License 1.0.0](LICENSE).

## Disclaimer

This library is an unofficial, reverse-engineered project created for educational and interoperability purposes. It is **not** endorsed by, associated with, or affiliated with Locket Camera, Inc. The private API surface it relies on may change or break at any time without notice. Use responsibly and respect Locket Camera's terms of service and community guidelines.
