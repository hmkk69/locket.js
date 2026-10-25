const { test } = require("node:test");
const assert = require("node:assert");
const { LocketClient, DeviceProfile } = require("../index.js");

test("device profile creation", () => {
  const device = new DeviceProfile();
  assert.ok(device.userAgent.includes("com.locket.Locket"));
  assert.ok(device.analyticsData.platform === "ios");
});

test("client initialization without session", () => {
  const client = new LocketClient({ sessionPath: "non_existent_session.json" });
  assert.strictEqual(client.isAuthenticated(), false);
  assert.ok(client.device);
});