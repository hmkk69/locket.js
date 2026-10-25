const { test } = require("node:test");
const { LocketClient } = require("../index.js");

const hasCredentials = Boolean(process.env.LOCKET_EMAIL && process.env.LOCKET_PASSWORD);

test("login flow (integration)", { skip: !hasCredentials }, async () => {
  const client = new LocketClient({ sessionPath: "session.json" });
  if (!client.isAuthenticated()) {
    await client.login(process.env.LOCKET_EMAIL, process.env.LOCKET_PASSWORD);
  }
  console.log("UID:", client.session.uid);
  const profile = await client.user.getProfile();
  console.log("Profile:", profile.first_name, profile.last_name);
});
