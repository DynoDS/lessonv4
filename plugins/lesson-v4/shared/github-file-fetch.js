"use strict";

// Bringing one file out of a GitHub repository the plugin does not clone.
//
// Two libraries need this and they need it identically: the drawing library
// (261,740 files) and the maths test-question bank (1,915 questions). Both live
// in their own repository, both are searched by an index of names the plugin
// ships, and both fetch only the handful of files a lesson actually chooses.
// The transport was written once for the drawings and is shared from here, so a
// fix to the proxy route or the private-repository route reaches both rather
// than one.
//
// The two addresses are tried in order for a reason. The plain file address is
// not counted against GitHub's API allowance, which is 60 requests an hour for
// a machine with no token, and a cloud machine shares its address with every
// other user on it, so the API alone can be used up before a run asks for its
// first file. A private repository answers 404 there, so the API is tried
// second, and both reasons are kept when neither works, so a failed run says
// what stopped it rather than only that something did.

const http = require("node:http");
const https = require("node:https");
const tls = require("node:tls");
const { execFileSync } = require("node:child_process");

const PROBE_TIMEOUT_MS = 6000;

function environment(source) {
  return source || process.env;
}

let tokenCache;

function githubToken(env) {
  if (tokenCache !== undefined) return tokenCache;
  const source = environment(env);
  const direct = (source.GITHUB_TOKEN || source.GH_TOKEN || "").trim();
  if (direct) {
    tokenCache = direct;
    return tokenCache;
  }
  try {
    const printed = execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: PROBE_TIMEOUT_MS,
    }).trim();
    tokenCache = printed || null;
  } catch (_) {
    tokenCache = null;
  }
  return tokenCache;
}

// Cloud machines reach the internet through a proxy named in HTTPS_PROXY. git,
// curl and Python's urllib follow it on their own; Node's https does not, so
// without this every request on such a machine goes nowhere while the clone and
// the photo fetchers beside it work.
function proxyFor(url, env) {
  const source = environment(env);
  const configured = (
    source.HTTPS_PROXY || source.https_proxy || source.ALL_PROXY || source.all_proxy || ""
  ).trim();
  if (!configured) return null;
  const host = new URL(url).hostname.toLowerCase();
  const bypass = (source.NO_PROXY || source.no_proxy || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase().replace(/:\d+$/, ""))
    .filter(Boolean);
  if (
    bypass.some(
      (entry) =>
        entry === "*" ||
        host === entry.replace(/^\./, "") ||
        host.endsWith(entry.startsWith(".") ? entry : `.${entry}`)
    )
  ) {
    return null;
  }
  try {
    return new URL(configured.includes("://") ? configured : `http://${configured}`);
  } catch (_) {
    return null;
  }
}

function tunnelAgent(proxy) {
  const agent = new https.Agent({ keepAlive: false });
  agent.createConnection = (options, callback) => {
    const headers = { Host: `${options.host}:${options.port || 443}` };
    if (proxy.username) {
      const credentials = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
      headers["Proxy-Authorization"] = `Basic ${Buffer.from(credentials).toString("base64")}`;
    }
    const connect = http.request({
      host: proxy.hostname,
      port: proxy.port || 80,
      method: "CONNECT",
      path: `${options.host}:${options.port || 443}`,
      headers,
      timeout: options.timeout,
    });
    connect.on("connect", (response, socket) => {
      if (response.statusCode !== 200) {
        socket.destroy();
        callback(new Error(`proxy refused the connection (HTTP ${response.statusCode})`));
        return;
      }
      callback(null, tls.connect({ socket, servername: options.host }));
    });
    connect.on("timeout", () => connect.destroy(new Error("proxy timed out")));
    connect.on("error", (error) => callback(error));
    connect.end();
  };
  return agent;
}

function request(url, { token, timeout, raw, env, userAgent, maxBytes }) {
  return new Promise((resolve) => {
    const headers = {
      "User-Agent": userAgent || "lesson-v4",
      Accept: raw ? "application/vnd.github.raw" : "application/vnd.github+json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const proxy = proxyFor(url, env);
    const options = { headers, timeout };
    if (proxy) options.agent = tunnelAgent(proxy);

    const call = https.get(url, options, (response) => {
      const status = response.statusCode || 0;
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        resolve(
          request(response.headers.location, { token, timeout, raw, env, userAgent, maxBytes })
        );
        return;
      }
      const chunks = [];
      let size = 0;
      let refused = false;
      response.on("data", (chunk) => {
        size += chunk.length;
        if (maxBytes && size > maxBytes) {
          refused = true;
          response.destroy();
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        if (refused) resolve({ status: 0, body: null, error: "response too large" });
        else resolve({ status, body: Buffer.concat(chunks), error: null });
      });
      response.on("error", (error) => resolve({ status: 0, body: null, error: error.message }));
    });

    call.on("timeout", () => {
      call.destroy();
      resolve({ status: 0, body: null, error: "timed out" });
    });
    call.on("error", (error) => resolve({ status: 0, body: null, error: error.message }));
  });
}

function rawUrl(repository, reference, filePath) {
  return (
    `https://raw.githubusercontent.com/${repository}/` +
    `${encodeURIComponent(reference)}/${filePath}`
  );
}

function contentsUrl(repository, reference, filePath) {
  return (
    `https://api.github.com/repos/${repository}/contents/` +
    `${filePath}?ref=${encodeURIComponent(reference)}`
  );
}

function failure(answer) {
  return answer.error || `HTTP ${answer.status}`;
}

// Tries the plain file first and the API second (a private repository, or a
// token-only route), and keeps both reasons when neither works.
async function downloadFile({ repository, reference, filePath, timeout, env, userAgent, maxBytes }) {
  const token = githubToken(env);
  const shared = { token, timeout, raw: true, env, userAgent, maxBytes };
  const plain = await request(rawUrl(repository, reference, filePath), shared);
  if (plain.status === 200 && plain.body && plain.body.length) return { answer: plain, reasons: [] };
  const api = await request(contentsUrl(repository, reference, filePath), shared);
  if (api.status === 200 && api.body && api.body.length) return { answer: api, reasons: [] };
  return { answer: null, reasons: [`file address: ${failure(plain)}`, `API: ${failure(api)}`] };
}

// Tests reach in to clear the remembered token between cases.
function forgetToken() {
  tokenCache = undefined;
}

module.exports = {
  PROBE_TIMEOUT_MS,
  contentsUrl,
  downloadFile,
  environment,
  forgetToken,
  githubToken,
  proxyFor,
  rawUrl,
  request,
  tunnelAgent,
};
