// Generated from server.ts by scripts/build-server.mjs. Do not edit by hand.
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  NEXUSS_TOOL_REGISTRY: () => NEXUSS_TOOL_REGISTRY
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);

// node_modules/@nexuss0781/nar/dist/index.js
var NarError = class extends Error {
  status;
  code;
  route;
  body;
  constructor(message, status, code, route, body) {
    super(message);
    this.name = "NarError";
    this.status = status;
    this.code = code;
    this.route = route;
    this.body = body;
  }
};
var DEFAULT_MODEL = "auto";
function envBase() {
  const raw = process.env.NAR_BASE_URL || process.env.OMNIROUTE_BASE_URL || "";
  const base = raw.replace(/\/+$/, "");
  if (!base) {
    throw new NarError("No deployment URL. Set NAR_BASE_URL to your NAR deployment (for example https://nar-abc123.vercel.app), or pass baseUrl explicitly, or bind one with createClient(). Every fork deploys to its own URL, so there is no correct default.", 500, "missing_base_url", { provider: null, model: null, attemptTrail: null }, null);
  }
  return base;
}
function envKey() {
  const key = process.env.NAR_API_KEY || process.env.OMNIROUTE_AI_API_KEY || "";
  if (!key) {
    throw new NarError("No master key. Set NAR_API_KEY (or OMNIROUTE_AI_API_KEY) to your NAR gateway key.", 401, "missing_api_key", { provider: null, model: null, attemptTrail: null }, null);
  }
  return key;
}
function apiBase(override) {
  const base = (override || envBase()).replace(/\/+$/, "");
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`;
}
function routeFrom(headers) {
  return {
    provider: headers.get("x-omniroute-provider"),
    model: headers.get("x-omniroute-model"),
    attemptTrail: headers.get("x-omniroute-attempt-trail")
  };
}
function buildMessages(prompt, options) {
  const messages = Array.isArray(options.messages) ? [...options.messages] : [];
  if (options.system && !messages[0]?.role?.startsWith("system")) {
    messages.unshift({ role: "system", content: options.system });
  }
  if (typeof prompt === "string" && prompt !== "")
    messages.push({ role: "user", content: prompt });
  if (messages.length === 0)
    messages.push({ role: "user", content: "" });
  return messages;
}
function buildBody(prompt, options, stream2) {
  return {
    model: options.model || DEFAULT_MODEL,
    messages: buildMessages(prompt, options),
    ...options.temperature === void 0 ? {} : { temperature: options.temperature },
    ...options.maxTokens === void 0 ? {} : { max_tokens: options.maxTokens },
    ...options.tools ? { tools: options.tools } : {},
    ...options.toolChoice === void 0 ? {} : { tool_choice: options.toolChoice },
    ...stream2 ? { stream: true } : {},
    ...options.extra ?? {}
  };
}
async function readError(response, route) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  const record = body ?? {};
  const message = record.error?.message || `NAR request failed with status ${response.status}`;
  const code = record.error?.code || record.error?.type || `http_${response.status}`;
  return new NarError(message, response.status, code, route, body);
}
function mergeToolCalls(into, deltas) {
  if (!Array.isArray(deltas))
    return into;
  for (const call of deltas) {
    const index = typeof call.index === "number" ? call.index : 0;
    const existing = into[index] ??= { arguments: "" };
    if (typeof call.id === "string" && call.id)
      existing.id = call.id;
    const fn = call.function;
    if (fn && typeof fn.name === "string")
      existing.name = fn.name;
    if (fn && typeof fn.arguments === "string")
      existing.arguments += fn.arguments;
  }
  return into;
}
function toToolCalls(into) {
  return Object.keys(into).map(Number).sort((a, b) => a - b).map((index) => {
    const entry = into[index];
    return {
      id: entry.id,
      type: "function",
      function: { name: entry.name ?? "", arguments: entry.arguments || "{}" }
    };
  });
}
function toolCallsFromMessage(message) {
  const calls = message?.tool_calls;
  if (!Array.isArray(calls))
    return [];
  return calls.filter((call) => call && typeof call === "object").map((call) => ({
    id: typeof call.id === "string" ? call.id : void 0,
    type: "function",
    function: {
      name: typeof call.function?.name === "string" ? call.function.name : "",
      arguments: typeof call.function?.arguments === "string" ? call.function.arguments : "{}"
    }
  }));
}
function parseChunk(payload, route, toolCalls) {
  try {
    const parsed = JSON.parse(payload);
    const choice = parsed?.choices?.[0] ?? {};
    const delta = choice.delta ?? {};
    mergeToolCalls(toolCalls, delta.tool_calls);
    return {
      delta: typeof delta.content === "string" ? delta.content : "",
      toolCalls: toToolCalls(toolCalls),
      finishReason: typeof choice.finish_reason === "string" ? choice.finish_reason : null,
      route
    };
  } catch {
    return { delta: "", toolCalls: toToolCalls(toolCalls), finishReason: null, route };
  }
}
async function* stream(prompt, options = {}) {
  for await (const event of streamEvents(prompt, options)) {
    if (event.delta)
      yield event.delta;
  }
}
async function* streamEvents(prompt, options = {}) {
  const response = await fetch(`${apiBase(options.baseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${options.apiKey || envKey()}`
    },
    body: JSON.stringify(buildBody(prompt, options, true)),
    signal: options.signal
  });
  const route = routeFrom(response.headers);
  if (!response.ok)
    throw await readError(response, route);
  if (!response.body)
    throw new NarError("NAR returned an empty stream", 502, "empty_stream", route, null);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const toolCalls = {};
  let buffer = "";
  let done = false;
  while (!done) {
    const { value, done: finished } = await reader.read();
    if (finished) {
      buffer += decoder.decode();
      done = true;
    } else {
      buffer += decoder.decode(value, { stream: true });
    }
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const payload = frame.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("");
      if (payload && payload !== "[DONE]")
        yield parseChunk(payload, route, toolCalls);
      boundary = buffer.indexOf("\n\n");
    }
  }
}
async function chat(prompt, options = {}) {
  let text = "";
  let route = { provider: null, model: null, attemptTrail: null };
  let toolCalls = [];
  let finishReason = null;
  for await (const event of streamEvents(prompt, options)) {
    text += event.delta;
    route = event.route;
    if (event.toolCalls.length)
      toolCalls = event.toolCalls;
    if (event.finishReason)
      finishReason = event.finishReason;
  }
  return { text, route, toolCalls, finishReason, usage: null, raw: null };
}
async function complete(prompt, options = {}) {
  const response = await fetch(`${apiBase(options.baseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${options.apiKey || envKey()}`
    },
    body: JSON.stringify(buildBody(prompt, options, false)),
    signal: options.signal
  });
  const route = routeFrom(response.headers);
  if (!response.ok)
    throw await readError(response, route);
  const body = await response.json();
  const message = body?.choices?.[0]?.message;
  return {
    text: message?.content ?? "",
    route,
    toolCalls: toolCallsFromMessage(message),
    finishReason: typeof body?.choices?.[0]?.finish_reason === "string" ? body.choices[0].finish_reason : null,
    usage: body?.usage ?? null,
    raw: body
  };
}
async function models(options = {}) {
  const response = await fetch(`${apiBase(options.baseUrl)}/models`, {
    headers: { authorization: `Bearer ${options.apiKey || envKey()}` },
    signal: options.signal
  });
  const route = routeFrom(response.headers);
  if (!response.ok)
    throw await readError(response, route);
  const body = await response.json();
  return (body.data ?? []).map((entry) => String(entry.id)).filter(Boolean);
}
async function health(options = {}) {
  const healthBase = (options.baseUrl || envBase()).replace(/\/+$/, "");
  const response = await fetch(`${healthBase}/api/v1/health`, { signal: options.signal });
  return await response.json();
}
function createClient(options = {}) {
  const baseUrl = (options.baseUrl || envBase()).replace(/\/+$/, "");
  if (!options.apiKey && !process.env.NAR_API_KEY && !process.env.OMNIROUTE_AI_API_KEY) {
    throw new NarError("No API key. Pass apiKey to createClient(), or set NAR_API_KEY to the OMNIROUTE_AI_API_KEY value you configured on your deployment.", 401, "missing_api_key", { provider: null, model: null, attemptTrail: null }, null);
  }
  const apiKey = options.apiKey;
  const withKey = (o = {}) => apiKey ? { ...o, apiKey, baseUrl } : { ...o, baseUrl };
  return {
    baseUrl,
    stream: (p, o) => stream(p, withKey(o)),
    streamEvents: (p, o) => streamEvents(p, withKey(o)),
    chat: (p, o) => chat(p, withKey(o)),
    complete: (p, o) => complete(p, withKey(o)),
    models: (o = {}) => models({ ...o, baseUrl, ...apiKey ? { apiKey } : {} }),
    health: (o = {}) => health({ ...o, baseUrl })
  };
}

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT) || 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
var NAR_BASE_URL = (process.env.NAR_BASE_URL || process.env.OMNIROUTE_BASE_URL || "https://omniouter-vercel.vercel.app").replace(/\/+$/, "");
var NAR_API_KEY = (process.env.NAR_API_KEY || process.env.OMNIROUTE_AI_API_KEY || "my-super-secret-gateway-token-123").trim();
var FILESYSTEM_KIT_URL = (process.env.FILESYSTEM_KIT_URL || "https://filesystem-kit.wasmer.app").replace(/\/+$/, "");
var NAR_MODEL = process.env.NAR_MODEL || "auto";
var MAX_TOOL_CYCLES = 6;
var MAX_GATEWAY_RETRIES = 2;
var GATEWAY_TIMEOUT_MS = Number(process.env.NAR_TIMEOUT_MS) || 45e3;
var nar = createClient({ baseUrl: NAR_BASE_URL, apiKey: NAR_API_KEY });
function getWorkspaceRoot() {
  if (process.env.WORKSPACE_ROOT && import_fs.default.existsSync(process.env.WORKSPACE_ROOT)) {
    return import_path.default.resolve(process.env.WORKSPACE_ROOT);
  }
  if (process.env.FILESYSTEM_ROOT && import_fs.default.existsSync(process.env.FILESYSTEM_ROOT)) {
    return import_path.default.resolve(process.env.FILESYSTEM_ROOT);
  }
  return import_path.default.resolve(process.cwd());
}
function resolveSafePath(userPath = ".") {
  const root = getWorkspaceRoot();
  let clean = (userPath || ".").trim();
  clean = clean.replace(/^\/home\/ubuntu(\/|$)/, "./");
  clean = clean.replace(/^\/data(\/|$)/, "./");
  clean = clean.replace(/^\/app\/applet(\/|$)/, "./");
  const normalized = import_path.default.normalize(clean.replace(/^[/\\]+/, ""));
  const target = import_path.default.resolve(root, normalized || ".");
  if (!target.startsWith(root)) {
    return root;
  }
  return target;
}
function getRelativeWorkspacePath(absPath) {
  const root = getWorkspaceRoot();
  const rel = import_path.default.relative(root, absPath);
  return rel ? rel.replace(/\\/g, "/") : ".";
}
function localListFiles(args) {
  const target = resolveSafePath(args.path || ".");
  if (!import_fs.default.existsSync(target)) {
    throw new Error(`Directory does not exist: ${args.path || "."}`);
  }
  const stat = import_fs.default.statSync(target);
  if (!stat.isDirectory()) {
    return {
      path: getRelativeWorkspacePath(target),
      type: "file",
      size: stat.size
    };
  }
  const entries = import_fs.default.readdirSync(target, { withFileTypes: true });
  const showAll = Boolean(args.all);
  const results = entries.filter((e) => showAll || !e.name.startsWith(".")).map((e) => ({
    name: e.name,
    path: getRelativeWorkspacePath(import_path.default.join(target, e.name)),
    isDirectory: e.isDirectory(),
    size: e.isFile() ? import_fs.default.statSync(import_path.default.join(target, e.name)).size : void 0,
    modifiedAt: import_fs.default.statSync(import_path.default.join(target, e.name)).mtime.toISOString()
  }));
  return {
    path: getRelativeWorkspacePath(target),
    entries: results,
    count: results.length
  };
}
function localReadFile(args) {
  if (!args.path) throw new Error('Missing "path" parameter');
  const target = resolveSafePath(args.path);
  if (!import_fs.default.existsSync(target)) {
    throw new Error(`File not found: ${args.path}`);
  }
  const stat = import_fs.default.statSync(target);
  if (stat.isDirectory()) {
    throw new Error(`Target is a directory, not a file: ${args.path}`);
  }
  const raw = import_fs.default.readFileSync(target, "utf-8");
  const lines = raw.split(/\r?\n/);
  const totalLines = lines.length;
  const startLine = args.range?.start ?? args.start;
  const endLine = args.range?.end ?? args.end;
  let sliced = lines;
  if (startLine !== void 0 || endLine !== void 0) {
    const s = Math.max(1, Number(startLine) || 1) - 1;
    const e = endLine !== void 0 ? Math.min(totalLines, Number(endLine)) : totalLines;
    sliced = lines.slice(s, e);
  } else if (args.head !== void 0) {
    sliced = lines.slice(0, Math.max(1, Number(args.head)));
  } else if (args.tail !== void 0) {
    sliced = lines.slice(-Math.max(1, Number(args.tail)));
  }
  return {
    path: getRelativeWorkspacePath(target),
    content: sliced.join("\n"),
    totalLines,
    bytes: stat.size
  };
}
function localWriteFile(args) {
  if (!args.path) throw new Error('Missing "path" parameter');
  const target = resolveSafePath(args.path);
  const dir = import_path.default.dirname(target);
  if (!import_fs.default.existsSync(dir)) {
    import_fs.default.mkdirSync(dir, { recursive: true });
  }
  if (args.range && import_fs.default.existsSync(target)) {
    const raw = import_fs.default.readFileSync(target, "utf-8");
    const lines = raw.split(/\r?\n/);
    const s = Math.max(1, Number(args.range.start) || 1) - 1;
    const e = Math.min(lines.length, Number(args.range.end) || lines.length);
    const newLines = (args.content ?? "").split(/\r?\n/);
    lines.splice(s, e - s, ...newLines);
    import_fs.default.writeFileSync(target, lines.join("\n"), "utf-8");
    return {
      success: true,
      path: getRelativeWorkspacePath(target),
      linesModified: e - s
    };
  }
  const content = args.content ?? "";
  if (args.append && import_fs.default.existsSync(target)) {
    import_fs.default.appendFileSync(target, content, "utf-8");
  } else {
    import_fs.default.writeFileSync(target, content, "utf-8");
  }
  return {
    success: true,
    path: getRelativeWorkspacePath(target),
    bytesWritten: Buffer.byteLength(content)
  };
}
function localModifyFile(args) {
  if (!args.path) throw new Error('Missing "path" parameter');
  const target = resolveSafePath(args.path);
  if (!import_fs.default.existsSync(target)) {
    throw new Error(`File not found: ${args.path}`);
  }
  if (args.rewrite !== void 0 && args.range) {
    const raw = import_fs.default.readFileSync(target, "utf-8");
    const lines = raw.split(/\r?\n/);
    const s = Math.max(1, Number(args.range.start) || 1) - 1;
    const e = Math.min(lines.length, Number(args.range.end) || lines.length);
    const newLines = (args.rewrite ?? "").split(/\r?\n/);
    lines.splice(s, e - s, ...newLines);
    import_fs.default.writeFileSync(target, lines.join("\n"), "utf-8");
    return {
      success: true,
      path: getRelativeWorkspacePath(target),
      rewriteApplied: true
    };
  }
  let content = import_fs.default.readFileSync(target, "utf-8");
  let changesMade = 0;
  if (args.edits && Array.isArray(args.edits)) {
    for (const edit of args.edits) {
      if (edit.find && content.includes(edit.find)) {
        content = content.replace(edit.find, edit.replace ?? "");
        changesMade += 1;
      }
    }
  } else {
    const findStr = args.match ?? args.old_str ?? args.find;
    const replaceStr = args.replacement ?? args.new_str ?? args.replace ?? "";
    if (findStr) {
      if (!content.includes(findStr)) {
        throw new Error(`Target search string not found in ${args.path}`);
      }
      if (args.occurrence && Number(args.occurrence) > 1) {
        let count = 0;
        let pos = 0;
        let replaced = false;
        while ((pos = content.indexOf(findStr, pos)) !== -1) {
          count++;
          if (count === Number(args.occurrence)) {
            content = content.slice(0, pos) + replaceStr + content.slice(pos + findStr.length);
            replaced = true;
            changesMade = 1;
            break;
          }
          pos += findStr.length;
        }
        if (!replaced) {
          throw new Error(`Occurrence ${args.occurrence} of target string not found in ${args.path}`);
        }
      } else {
        content = content.replace(findStr, replaceStr);
        changesMade += 1;
      }
    }
  }
  import_fs.default.writeFileSync(target, content, "utf-8");
  return {
    success: true,
    path: getRelativeWorkspacePath(target),
    changesApplied: changesMade
  };
}
function localGlobFiles(args) {
  const root = resolveSafePath(args.cwd || args.path || ".");
  const pattern = (args.pattern || "*").trim();
  const matched = [];
  const globRegex = new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, ".") + "$");
  const walk = (dir) => {
    if (!import_fs.default.existsSync(dir)) return;
    const entries = import_fs.default.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
      const full = import_path.default.join(dir, entry.name);
      const rel = getRelativeWorkspacePath(full);
      if (globRegex.test(entry.name) || globRegex.test(rel)) {
        matched.push(rel);
      }
      if (entry.isDirectory()) {
        walk(full);
      }
    }
  };
  walk(root);
  return {
    pattern,
    matches: matched,
    count: matched.length
  };
}
function localGrepFiles(args) {
  if (!args.pattern) throw new Error('Missing "pattern" parameter');
  const root = resolveSafePath(args.path || ".");
  if (!import_fs.default.existsSync(root)) {
    throw new Error(`File or directory not found: ${args.path || "."}`);
  }
  const flags = args.ignoreCase !== false ? "i" : "";
  const regex = new RegExp(args.pattern, flags);
  const results = [];
  const stat = import_fs.default.statSync(root);
  if (stat.isFile()) {
    try {
      const content = import_fs.default.readFileSync(root, "utf-8");
      const lines = content.split(/\r?\n/);
      lines.forEach((lineText, idx) => {
        if (regex.test(lineText)) {
          results.push({
            file: getRelativeWorkspacePath(root),
            line: idx + 1,
            text: lineText.trim()
          });
        }
      });
    } catch {
    }
    return {
      pattern: args.pattern,
      matches: results,
      totalMatches: results.length
    };
  }
  const walk = (dir) => {
    if (!import_fs.default.existsSync(dir)) return;
    const entries = import_fs.default.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
      const full = import_path.default.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        try {
          const content = import_fs.default.readFileSync(full, "utf-8");
          const lines = content.split(/\r?\n/);
          lines.forEach((lineText, idx) => {
            if (regex.test(lineText)) {
              results.push({
                file: getRelativeWorkspacePath(full),
                line: idx + 1,
                text: lineText.trim()
              });
            }
          });
        } catch {
        }
      }
    }
  };
  walk(root);
  return {
    pattern: args.pattern,
    matches: results.slice(0, 100),
    totalMatches: results.length
  };
}
function localDeleteFile(args) {
  if (!args.path) throw new Error('Missing "path" parameter');
  const target = resolveSafePath(args.path);
  if (!import_fs.default.existsSync(target)) {
    throw new Error(`File or directory not found: ${args.path}`);
  }
  const stat = import_fs.default.statSync(target);
  if (stat.isDirectory()) {
    import_fs.default.rmSync(target, { recursive: Boolean(args.recursive), force: true });
  } else {
    import_fs.default.unlinkSync(target);
  }
  return {
    success: true,
    path: getRelativeWorkspacePath(target)
  };
}
function normalizePathForFilesystemKit(rawPath) {
  if (!rawPath || rawPath === "." || rawPath === "./") return ".";
  const trimmed = rawPath.trim();
  if (trimmed.startsWith("/app/applet/")) {
    const rel = trimmed.slice("/app/applet/".length);
    return rel ? `/home/ubuntu/${rel}` : "/home/ubuntu";
  }
  if (trimmed === "/app/applet") {
    return "/home/ubuntu";
  }
  if (trimmed.startsWith("/data/")) {
    const rel = trimmed.slice("/data/".length);
    return rel ? `/home/ubuntu/${rel}` : "/home/ubuntu";
  }
  if (trimmed === "/data") {
    return "/home/ubuntu";
  }
  if (trimmed.startsWith("/home/ubuntu")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `/home/ubuntu${trimmed}`;
  }
  return trimmed;
}
async function callFilesystemKit(name, args) {
  if (FILESYSTEM_KIT_URL) {
    const sanitizedArgs = { ...args };
    if (sanitizedArgs.path !== void 0) {
      sanitizedArgs.path = normalizePathForFilesystemKit(sanitizedArgs.path);
    }
    if (sanitizedArgs.cwd !== void 0) {
      sanitizedArgs.cwd = normalizePathForFilesystemKit(sanitizedArgs.cwd);
    }
    const request = async (endpoint, init) => {
      const response = await fetch(`${FILESYSTEM_KIT_URL}${endpoint}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...init?.headers || {} }
      });
      const body = await response.text();
      if (!response.ok) {
        try {
          const parsed = JSON.parse(body);
          throw new Error(parsed.message || parsed.error || `Filesystem Kit error (${response.status})`);
        } catch (e) {
          if (e.message && !e.message.startsWith("Unexpected")) throw e;
          throw new Error(`Filesystem Kit ${response.status}: ${body.slice(0, 500)}`);
        }
      }
      return (response.headers.get("content-type") || "").includes("application/json") ? JSON.parse(body) : body;
    };
    const query = (values) => new URLSearchParams(
      Object.entries(values).filter(([, value]) => value !== void 0 && value !== null).map(([key, value]) => [key, String(value)])
    ).toString();
    switch (name) {
      case "read_file":
        return await request(`/api/read?${query(sanitizedArgs)}`);
      case "write_file":
        return await request("/api/write", { method: "PUT", body: JSON.stringify(sanitizedArgs) });
      case "modify_file":
        return await request("/api/modify", { method: "PATCH", body: JSON.stringify(sanitizedArgs) });
      case "list_files":
        return await request(`/api/list?${query({ path: sanitizedArgs.path || ".", all: sanitizedArgs.all })}`);
      case "glob_files":
        return await request(`/api/glob?${query(sanitizedArgs)}`);
      case "grep_files":
        return await request(`/api/grep?${query({ pattern: sanitizedArgs.pattern, path: sanitizedArgs.path || ".", ignoreCase: sanitizedArgs.ignoreCase, all: sanitizedArgs.all })}`);
      case "delete_file":
        return await request(`/api/delete?${query(sanitizedArgs)}`, { method: "DELETE" });
      default:
        throw new Error(`Unknown filesystem tool: ${name}`);
    }
  }
  switch (name) {
    case "read_file":
      return localReadFile(args);
    case "write_file":
      return localWriteFile(args);
    case "modify_file":
      return localModifyFile(args);
    case "list_files":
      return localListFiles(args);
    case "glob_files":
      return localGlobFiles(args);
    case "grep_files":
      return localGrepFiles(args);
    case "delete_file":
      return localDeleteFile(args);
    default:
      throw new Error(`Unknown filesystem tool: ${name}`);
  }
}
var NEXUSS_TOOL_REGISTRY = [
  {
    name: "read_file",
    description: "Read contents of a text file from the workspace.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: 'Relative path to file (e.g. "src/App.tsx")' },
        head: { type: "integer", description: "Limit to first N lines" },
        tail: { type: "integer", description: "Limit to last N lines" },
        start: { type: "integer", description: "Starting line number (1-based)" },
        end: { type: "integer", description: "Ending line number" }
      },
      required: ["path"]
    }
  },
  {
    name: "write_file",
    description: "Create or replace a text file in the workspace.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path to file" },
        content: { type: "string", description: "Exact file text content" },
        append: { type: "boolean", description: "Set true to append content" }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "modify_file",
    description: "Replace an exact match string or rewrite a section in a file.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path to file" },
        match: { type: "string", description: "Exact target string to replace" },
        replacement: { type: "string", description: "Replacement string" }
      },
      required: ["path"]
    }
  },
  {
    name: "list_files",
    description: "List immediate files and subdirectories in a folder.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: 'Folder path (default: ".")' },
        all: { type: "boolean", description: "Include hidden files" }
      }
    }
  },
  {
    name: "glob_files",
    description: 'Find workspace files matching a glob pattern (e.g. "**/*.tsx", "src/components/*").',
    parameters: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Glob search pattern" },
        cwd: { type: "string", description: "Base directory" }
      },
      required: ["pattern"]
    }
  },
  {
    name: "grep_files",
    description: "Search workspace files for matching text lines or regex.",
    parameters: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Search term or regex pattern" },
        path: { type: "string", description: "File or directory path" },
        ignoreCase: { type: "boolean", description: "Case-insensitive search" }
      },
      required: ["pattern"]
    }
  },
  {
    name: "delete_file",
    description: "Delete a workspace file or directory (use only when explicitly requested).",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to delete" },
        recursive: { type: "boolean", description: "Recursive delete for directories" }
      },
      required: ["path"]
    }
  }
];
var NEXUSS_TOOL_NAMES = new Set(NEXUSS_TOOL_REGISTRY.map((tool) => tool.name));
function validateNexussToolCall(name, args) {
  if (!name || !NEXUSS_TOOL_NAMES.has(name)) {
    return { ok: false, reason: `unknown tool "${name ?? ""}"` };
  }
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return { ok: false, reason: `parameters for "${name}" were not an object` };
  }
  const definition = NEXUSS_TOOL_REGISTRY.find((tool) => tool.name === name);
  for (const field of definition.parameters.required || []) {
    if (definition.parameters.properties[field]?.type !== "string") continue;
    const value = args[field];
    if (typeof value !== "string" || value.trim() === "") {
      return { ok: false, reason: `"${name}" requires a non-empty string "${field}"` };
    }
  }
  return { ok: true, args };
}
var NEXUSS_TOOL_PROTOCOL_SPEC = `
# NEXUSS PERSISTENT COMPUTER & TOOL CALLING PROTOCOL (NTCP v1.0)
You are Nexuss AI operating on your dedicated persistent computer.
Your filesystem is centralized and persistent across sessions via the external Nexuss FileSystem Kit.
- Persistent Root Directory: \`/home/ubuntu\`
- Your computer's working environment and persistent storage are rooted at \`/home/ubuntu\`.
- All your created files, notes, project files, and workspaces reside under \`/home/ubuntu\`.
- You can refer to paths relative to your home (e.g. \`notes.txt\`, \`src/index.js\`) or as \`/home/ubuntu/...\`.
- For centralized data integrity and system security, operations outside \`/home/ubuntu\` are strictly rejected.

## Available Nexuss Tools:
${JSON.stringify(NEXUSS_TOOL_REGISTRY, null, 2)}

## Nexuss Tool Call Schema:
To invoke a tool, output a strictly formatted Nexuss Tool Block:
<nexuss_tool_call>
{
  "tool": "<tool_name>",
  "parameters": {
    "<parameter_name>": "<value>"
  }
}
</nexuss_tool_call>

You may also call multiple tools simultaneously:
<nexuss_tool_call>
[
  { "tool": "list_files", "parameters": { "path": "." } },
  { "tool": "read_file", "parameters": { "path": "package.json" } }
]
</nexuss_tool_call>

## Protocol Rules:
1. When you need workspace information, output the <nexuss_tool_call> block immediately.
2. The Nexuss Tool Engine will execute the action and return the output inside <nexuss_tool_result> blocks.
3. After receiving <nexuss_tool_result>, continue your thought process and provide your comprehensive answer to the user.
`;
function extractNexussToolCalls(content) {
  if (!content) return [];
  const calls = [];
  const validTools = /* @__PURE__ */ new Set(["read_file", "write_file", "modify_file", "list_files", "glob_files", "grep_files", "delete_file"]);
  const processJsonPayload = (parsed, raw) => {
    if (!parsed) return;
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const toolName = item.tool || item.name || item.action || (item.nexuss_tool_call ? item.nexuss_tool_call.tool || item.nexuss_tool_call.name : null);
      if (toolName && typeof toolName === "string" && validTools.has(toolName.trim())) {
        let args = item.parameters || item.args || item.arguments || (item.nexuss_tool_call ? item.nexuss_tool_call.parameters || item.nexuss_tool_call.args : null) || item;
        const cleanArgs = typeof args === "object" && args !== null ? { ...args } : {};
        delete cleanArgs.tool;
        delete cleanArgs.name;
        delete cleanArgs.action;
        delete cleanArgs.nexuss_tool_call;
        calls.push({ name: toolName.trim(), args: cleanArgs, rawMatch: raw });
      }
    }
  };
  const xmlRegex = /<(?:nexuss_tool_call|tool_call|nexuss_action)(?:\s+tool=["']([^"']+)["']|\s+name=["']([^"']+)["'])?>([\s\S]*?)<\/(?:nexuss_tool_call|tool_call|nexuss_action)>/gi;
  let match;
  while ((match = xmlRegex.exec(content)) !== null) {
    const directTool = match[1] || match[2];
    const body = match[3]?.trim();
    if (body) {
      try {
        const parsed = JSON.parse(body);
        if (directTool && typeof parsed === "object" && !Array.isArray(parsed)) {
          parsed.tool = directTool;
        }
        processJsonPayload(parsed, match[0]);
      } catch {
      }
    }
  }
  const codeBlockRegex = /```(?:nexuss_tool|tool_call|nexuss_action|nexuss|json_tool)\s*([\s\S]*?)```/gi;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const body = match[1]?.trim();
    if (body) {
      try {
        const parsed = JSON.parse(body);
        processJsonPayload(parsed, match[0]);
      } catch {
      }
    }
  }
  if (calls.length === 0) {
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?\{[\s\S]*?\})\s*```/gi;
    while ((match = jsonBlockRegex.exec(content)) !== null) {
      const body = match[1]?.trim();
      if (body) {
        try {
          const parsed = JSON.parse(body);
          processJsonPayload(parsed, match[0]);
        } catch {
        }
      }
    }
  }
  return calls;
}
function sanitizeFinalOutput(content) {
  if (!content) return "";
  let cleaned = content;
  cleaned = cleaned.replace(/<(?:nexuss_tool_call|tool_call|nexuss_action)[\s\S]*?<\/(?:nexuss_tool_call|tool_call|nexuss_action)>/gi, "");
  cleaned = cleaned.replace(/<(?:nexuss_tool_result|tool_result)[\s\S]*?<\/(?:nexuss_tool_result|tool_result)>/gi, "");
  cleaned = cleaned.replace(/```(?:nexuss_tool|tool_call|nexuss_action|nexuss|json_tool)[\s\S]*?```/gi, "");
  return cleaned.trim();
}
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function isRetriableGatewayError(err) {
  return err instanceof NarError && (err.status === 503 || err.status === 429);
}
async function narChatOnce(options) {
  const deadline = AbortSignal.timeout(GATEWAY_TIMEOUT_MS);
  const signal = options.signal ? AbortSignal.any([options.signal, deadline]) : deadline;
  return nar.chat("", {
    model: NAR_MODEL,
    messages: options.messages,
    temperature: options.temperature,
    extra: { routing_class: options.routingClass },
    signal
  });
}
async function narChatWithRetry(options) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await narChatOnce(options);
    } catch (err) {
      if (!isRetriableGatewayError(err) || attempt >= MAX_GATEWAY_RETRIES) throw err;
      console.warn(`Gateway attempt ${attempt + 1} failed (${err.code}); backing off`);
      await sleep(500 * 2 ** attempt);
    }
  }
}
function describeGatewayError(err) {
  if (err instanceof NarError) {
    console.error("NAR request failed", { status: err.status, code: err.code, route: err.route });
    return {
      status: err.status === 401 || err.status === 403 || err.status === 429 ? err.status : 502,
      body: {
        error: "AI gateway request failed",
        code: err.code,
        message: err.message,
        provider: err.route?.provider ?? null,
        model: err.route?.model ?? null,
        attemptTrail: err.route?.attemptTrail ?? null,
        retryable: err.status === 503 || err.status === 429
      }
    };
  }
  if (err?.message === "Request aborted by user") {
    return { status: 499, body: { error: "Request aborted by user", retryable: false } };
  }
  console.error("Chat failure", err);
  return {
    status: 502,
    body: { error: "AI gateway request failed", code: "gateway_error", message: err?.message, retryable: true }
  };
}
async function runNexussTool(name, args) {
  const validated = validateNexussToolCall(name, args);
  if (!validated.ok) {
    return { ok: false, content: JSON.stringify({ error: `rejected before execution: ${validated.reason}` }) };
  }
  try {
    const result = await callFilesystemKit(name, validated.args);
    return { ok: true, content: typeof result === "string" ? result : JSON.stringify(result, null, 2) };
  } catch (err) {
    return { ok: false, content: JSON.stringify({ error: err?.message || "tool failed" }) };
  }
}
async function callNarChat({
  messages,
  systemInstruction,
  temperature = 0.7,
  routingClass = "agent-balanced",
  signal
}) {
  const fullSystemInstruction = `${systemInstruction || "You are Nexuss AI, a high-performance intelligence assistant."}

${NEXUSS_TOOL_PROTOCOL_SPEC}`;
  const workingMessages = [
    { role: "system", content: fullSystemInstruction },
    ...messages.map((m) => ({
      role: m.role === "model" ? "assistant" : m.role,
      content: m.content || ""
    }))
  ];
  let route = { provider: null, model: null, attemptTrail: null };
  for (let toolCycle = 0; toolCycle < MAX_TOOL_CYCLES; toolCycle += 1) {
    if (signal?.aborted) throw new Error("Request aborted by user");
    const result = await narChatWithRetry({ messages: workingMessages, temperature, routingClass, signal });
    route = result.route;
    const rawText = result.text || "";
    const textToolCalls = extractNexussToolCalls(rawText);
    if (textToolCalls.length === 0) {
      const cleanOutput = sanitizeFinalOutput(rawText) || rawText;
      if (cleanOutput.trim().length > 0) {
        return { text: cleanOutput.trim(), route };
      }
      break;
    }
    workingMessages.push({ role: "assistant", content: rawText });
    let toolResultsBlock = "";
    for (const call of textToolCalls) {
      const { ok, content } = await runNexussTool(call.name, call.args);
      const status = ok ? "success" : "error";
      toolResultsBlock += `
<nexuss_tool_result tool="${call.name}" status="${status}">
${content}
</nexuss_tool_result>`;
    }
    workingMessages.push({
      role: "user",
      content: `Nexuss Tool Execution Output:${toolResultsBlock}

Please proceed with your analysis and deliver the response to the user.`
    });
  }
  const failure = new Error("Gateway produced no usable response within the tool budget");
  failure.route = route;
  throw failure;
}
app.post("/api/chat", async (req, res) => {
  try {
    const {
      prompt,
      messages: reqMessages,
      history,
      systemInstruction: customSystemInstruction,
      webSearch,
      deepResearch
    } = req.body;
    let conversationList = [];
    if (Array.isArray(reqMessages) && reqMessages.length > 0) {
      conversationList = reqMessages;
    } else if (Array.isArray(history) && history.length > 0) {
      conversationList = history.map((h) => ({
        role: h.role === "model" || h.role === "assistant" ? "assistant" : "user",
        content: h.content || h.parts?.[0]?.text || ""
      }));
      if (prompt) {
        conversationList.push({ role: "user", content: prompt });
      }
    } else if (prompt) {
      conversationList = [{ role: "user", content: prompt }];
    }
    if (conversationList.length === 0) {
      return res.status(400).json({ error: "No prompt or messages provided" });
    }
    const defaultSystemInstruction = `You are Nexuss AI, a minimal, ultra-clean, and high-performance AI assistant.
Your communication style is intelligent, polished, structured, and direct.
${deepResearch ? "DEEPER RESEARCH MODE IS ENABLED: Provide an exhaustive, multi-faceted analysis with Executive Summary, Core Findings, Structural Comparison / Data, and Concrete Action Items." : "Provide clear, concise, and beautifully organized answers."}
${webSearch ? "Incorporate up-to-date real-world context and structured citations where applicable." : ""}
Use markdown formatting with bold headings, clean bullet points, code blocks with syntax tags, and concise summaries.`;
    const systemInstruction = customSystemInstruction || defaultSystemInstruction;
    try {
      const result = await callNarChat({
        messages: conversationList,
        systemInstruction,
        temperature: deepResearch ? 0.3 : 0.7,
        routingClass: deepResearch ? "quality" : "agent-fast"
      });
      console.log(`served by ${result.route.provider}/${result.route.model}`);
      return res.json({
        role: "assistant",
        content: result.text,
        text: result.text,
        route: { provider: result.route.provider, model: result.route.model },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      const { status, body } = describeGatewayError(err);
      return res.status(status).json(body);
    }
  } catch (err) {
    console.error("Server error handling chat:", err);
    return res.status(500).json({
      error: "Error processing request, retrying...",
      retryable: true,
      details: err?.message
    });
  }
});
app.get("/api/models", async (req, res) => {
  try {
    const models2 = await nar.models();
    return res.json({ models: models2, count: models2.length });
  } catch (err) {
    const { status, body } = describeGatewayError(err);
    return res.status(status).json(body);
  }
});
app.get("/api/list", (req, res) => {
  try {
    const result = localListFiles({
      path: req.query.path || ".",
      all: req.query.all === "true"
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: "request_error", message: err.message });
  }
});
app.get("/api/read", (req, res) => {
  try {
    const result = localReadFile({
      path: req.query.path || "",
      head: req.query.head ? Number(req.query.head) : void 0,
      tail: req.query.tail ? Number(req.query.tail) : void 0,
      start: req.query.start ? Number(req.query.start) : void 0,
      end: req.query.end ? Number(req.query.end) : void 0
    });
    return res.json(result);
  } catch (err) {
    return res.status(404).json({ error: "not_found", message: err.message });
  }
});
app.put("/api/write", (req, res) => {
  try {
    const result = localWriteFile({
      path: req.body?.path || req.query.path || "",
      content: req.body?.content ?? "",
      append: req.body?.append ?? req.query.append === "true"
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: "write_error", message: err.message });
  }
});
app.patch("/api/modify", (req, res) => {
  try {
    const result = localModifyFile({
      path: req.body?.path || req.query.path || "",
      old_str: req.body?.old_str || req.body?.match || req.body?.find,
      new_str: req.body?.new_str || req.body?.replacement || req.body?.replace,
      match: req.body?.match,
      replacement: req.body?.replacement,
      find: req.body?.find,
      replace: req.body?.replace,
      edits: req.body?.edits
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: "modify_error", message: err.message });
  }
});
app.get("/api/glob", (req, res) => {
  try {
    const result = localGlobFiles({
      pattern: req.query.pattern || "*",
      path: req.query.path || req.query.cwd || "."
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: "glob_error", message: err.message });
  }
});
app.get("/api/grep", (req, res) => {
  try {
    const result = localGrepFiles({
      pattern: req.query.pattern || "",
      path: req.query.path || ".",
      ignoreCase: req.query.ignoreCase !== "false",
      all: req.query.all === "true"
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: "grep_error", message: err.message });
  }
});
app.delete("/api/delete", (req, res) => {
  try {
    const result = localDeleteFile({
      path: req.query.path || req.body?.path || "",
      recursive: req.query.recursive === "true" || Boolean(req.body?.recursive)
    });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: "delete_error", message: err.message });
  }
});
app.get("/api/health", async (req, res) => {
  let gateway;
  try {
    const report = await nar.health();
    gateway = { status: report.status, ready: report.ready, checks: report.checks };
  } catch (err) {
    gateway = { status: "unreachable", ready: false, error: err?.message || "health check failed" };
  }
  res.json({
    status: "ok",
    brand: "Nexuss AI",
    gateway,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
function findStaticDir() {
  const candidates = [
    process.env.STATIC_DIR,
    "/public",
    import_path.default.resolve(process.cwd(), "dist"),
    import_path.default.resolve(process.cwd(), "public"),
    "/app/dist"
  ].filter(Boolean);
  for (const cand of candidates) {
    if (import_fs.default.existsSync(cand) && import_fs.default.existsSync(import_path.default.join(cand, "index.html"))) {
      return cand;
    }
  }
  for (const cand of candidates) {
    if (import_fs.default.existsSync(cand)) return cand;
  }
  return import_path.default.resolve(process.cwd(), "dist");
}
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const staticRoot = findStaticDir();
    app.use(import_express.default.static(staticRoot));
    app.get("*", (req, res) => {
      const indexPath = import_path.default.join(staticRoot, "index.html");
      if (import_fs.default.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Nexuss AI</title></head><body><div id="root"></div></body></html>');
      }
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nexuss AI server is live at http://0.0.0.0:${PORT}`);
  });
}
startServer();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NEXUSS_TOOL_REGISTRY
});
