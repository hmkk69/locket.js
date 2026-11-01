const { test } = require("node:test");
const assert = require("node:assert");
const { LocketError, AuthenticationError, LocketAPIError, StorageUploadError } = require("../index.js");

test("exception hierarchy", () => {
  const auth = new AuthenticationError("bad");
  assert.ok(auth instanceof LocketError);
  assert.ok(auth instanceof Error);
  assert.strictEqual(auth.name, "AuthenticationError");

  const api = new LocketAPIError("fail", 404, { x: 1 });
  assert.strictEqual(api.statusCode, 404);
  assert.deepStrictEqual(api.responseData, { x: 1 });

  const up = new StorageUploadError("up");
  assert.ok(up instanceof LocketError);
});