export interface DeviceProfileOptions {
  autoEmulate?: boolean;
  installationId?: string | null;
  bundleId?: string | null;
  appVersion?: string | null;
  buildNumber?: string | null;
  modelName?: string | null;
  iosVersion?: string | null;
  hardwareModel?: string | null;
  customUserAgent?: string | null;
  customAnalytics?: any;
  appcheckToken?: string | null;
  instanceIdToken?: string | null;
}

export class DeviceProfile {
  constructor(options?: DeviceProfileOptions);
  autoEmulate: boolean;
  installationId: string;
  bundleId: string;
  appVersion: string;
  buildNumber: string;
  modelInfo: { name: string; model: string; hw: string; ios: string };
  customUserAgent: string | null;
  customAnalytics: any;
  appcheckToken: string | null;
  instanceIdToken: string | null;
  get userAgent(): string;
  get analyticsData(): any;
  get defaultHeaders(): Record<string, string>;
  setCustomDevice(options?: any): void;
  enableAutoEmulation(): void;
  toDict(): any;
  static fromDict(data: any): DeviceProfile;
}

export class SessionManager {
  static FIREBASE_API_KEY: string;
  sessionPath: string;
  device: DeviceProfile;
  uid: string | null;
  email: string | null;
  idToken: string | null;
  refreshToken: string | null;
  expiresAt: number;
  constructor(options?: { sessionPath?: string; device?: DeviceProfile | null });
  load(): boolean;
  save(): void;
  login(email: string, password: string): Promise<any>;
  refresh(): Promise<void>;
  getValidToken(): Promise<string>;
}

export class LocketClient {
  static API_BASE: string;
  device: DeviceProfile;
  session: SessionManager;
  user: any;
  moments: any;
  friends: any;
  chat: any;
  constructor(options?: any);
  setDevice(options?: any): void;
  isAuthenticated(): boolean;
  login(email: string, password: string): Promise<any>;
  postApi(endpoint: string, payload?: any, options?: any): Promise<any>;
}

export class LocketError extends Error {}
export class AuthenticationError extends LocketError {}
export class LocketAPIError extends LocketError { statusCode: number | null; responseData: any; }
export class StorageUploadError extends LocketError {}

export class UserModule { constructor(client: LocketClient); [key: string]: any; }
export class MomentsModule { constructor(client: LocketClient); [key: string]: any; }
export class FriendsModule { constructor(client: LocketClient); [key: string]: any; }
export class ChatModule { constructor(client: LocketClient); [key: string]: any; ReactionEmoji: any; }
export class NoteType { static [key: string]: string; }
export class ReactionEmoji { static [key: string]: any; }

export const MomentsModuleExport: any;
export {};