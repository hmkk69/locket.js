const { test } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const { fetchWithTimeout } = require("../lib/http");

test("fetchWithTimeout aborts on timeout", async () => {
  const server = http.createServer((req, res) => {
    setTimeout(() => res.end("ok"), 5000);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  let thrown = false;
  try {
    await fetchWithTimeout(`http://127.0.0.1:${port}/`, {}, 50);
  } catch (e) {
    thrown = true;
  }
  server.close();
  assert.ok(thrown, "expected timeout to throw");
});