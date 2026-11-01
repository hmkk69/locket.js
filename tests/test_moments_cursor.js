const { test } = require("node:test");
const assert = require("node:assert");
const { MomentsModule } = require("../index.js");

function makeModule() {
  const client = {
    session: {
      uid: "test-uid",
      getValidToken: async () => "test-token",
    },
    device: { defaultHeaders: {} },
  };
  return new MomentsModule(client);
}

test("moment cursor roundtrip", () => {
  const moments = makeModule();
  const date = "2026-01-01T00:00:00.000Z";
  const docName = "projects/locket-4252a/databases/locket/documents/history/test-uid/entries/abc";
  const token = moments.encodeQueryCursor({ date, docName });
  assert.ok(token);
  assert.deepStrictEqual(moments.decodeQueryCursor(token), { date, docName });
  assert.strictEqual(moments.decodeQueryCursor("not-a-token"), null);
  assert.strictEqual(moments.decodeQueryCursor(null), null);
});

test("parseFirestoreValue handles common Firestore types", () => {
  const moments = makeModule();
  assert.strictEqual(moments.parseFirestoreValue({ stringValue: "hello" }), "hello");
  assert.strictEqual(moments.parseFirestoreValue({ integerValue: "42" }), 42);
  assert.strictEqual(moments.parseFirestoreValue({ booleanValue: true }), true);
  assert.deepStrictEqual(moments.parseFirestoreValue({ mapValue: { fields: { a: { integerValue: "1" } } } }), { a: 1 });
  assert.deepStrictEqual(moments.parseFirestoreValue({ arrayValue: { values: [{ stringValue: "x" }] } }), ["x"]);
  assert.strictEqual(moments.parseFirestoreValue(null), null);
});

test("getDocDateValue falls back safely", () => {
  const moments = makeModule();
  assert.strictEqual(typeof moments.getDocDateValue({}), "string");
  assert.ok(moments.getDocDateValue({}).length > 0);
});