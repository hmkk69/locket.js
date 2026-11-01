const { LocketClient } = require("./lib/client");
const { DeviceProfile } = require("./lib/device");
const { SessionManager } = require("./lib/session");
const { LocketError, AuthenticationError, LocketAPIError, StorageUploadError } = require("./lib/exceptions");
const { UserModule } = require("./lib/modules/user");
const { MomentsModule, NoteType } = require("./lib/modules/moments");
const { FriendsModule } = require("./lib/modules/friends");
const { ChatModule, ReactionEmoji } = require("./lib/modules/chat");

module.exports = {
  LocketClient,
  DeviceProfile,
  SessionManager,
  LocketError,
  AuthenticationError,
  LocketAPIError,
  StorageUploadError,
  UserModule,
  MomentsModule,
  NoteType,
  FriendsModule,
  ChatModule,
  ReactionEmoji
};