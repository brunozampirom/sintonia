var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../node_modules/partyserver/dist/index.js
import { DurableObject, env } from "cloudflare:workers";

// ../../node_modules/partyserver/node_modules/nanoid/url-alphabet/index.js
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

// ../../node_modules/partyserver/node_modules/nanoid/index.browser.js
var nanoid = /* @__PURE__ */ __name((size = 21) => {
  let id = "";
  let bytes = crypto.getRandomValues(new Uint8Array(size |= 0));
  while (size--) {
    id += urlAlphabet[bytes[size] & 63];
  }
  return id;
}, "nanoid");

// ../../node_modules/partyserver/dist/index.js
if (!("OPEN" in WebSocket)) {
  const WebSocketStatus = {
    CONNECTING: WebSocket.READY_STATE_CONNECTING,
    OPEN: WebSocket.READY_STATE_OPEN,
    CLOSING: WebSocket.READY_STATE_CLOSING,
    CLOSED: WebSocket.READY_STATE_CLOSED
  };
  Object.assign(WebSocket, WebSocketStatus);
  Object.assign(WebSocket.prototype, WebSocketStatus);
}
function tryGetPartyServerMeta(ws) {
  try {
    const attachment = WebSocket.prototype.deserializeAttachment.call(ws);
    if (!attachment || typeof attachment !== "object") return null;
    if (!("__pk" in attachment)) return null;
    const pk = attachment.__pk;
    if (!pk || typeof pk !== "object") return null;
    const { id, tags } = pk;
    if (typeof id !== "string") return null;
    const { uri } = pk;
    return {
      id,
      tags: Array.isArray(tags) ? tags : [],
      uri: typeof uri === "string" ? uri : void 0
    };
  } catch {
    return null;
  }
}
__name(tryGetPartyServerMeta, "tryGetPartyServerMeta");
function isPartyServerWebSocket(ws) {
  return tryGetPartyServerMeta(ws) !== null;
}
__name(isPartyServerWebSocket, "isPartyServerWebSocket");
var AttachmentCache = class {
  static {
    __name(this, "AttachmentCache");
  }
  #cache = /* @__PURE__ */ new WeakMap();
  get(ws) {
    let attachment = this.#cache.get(ws);
    if (!attachment) {
      attachment = WebSocket.prototype.deserializeAttachment.call(ws);
      if (attachment !== void 0) this.#cache.set(ws, attachment);
      else throw new Error("Missing websocket attachment. This is most likely an issue in PartyServer, please open an issue at https://github.com/cloudflare/partykit/issues");
    }
    return attachment;
  }
  set(ws, attachment) {
    this.#cache.set(ws, attachment);
    WebSocket.prototype.serializeAttachment.call(ws, attachment);
  }
};
var attachments = new AttachmentCache();
var connections = /* @__PURE__ */ new WeakSet();
var isWrapped = /* @__PURE__ */ __name((ws) => {
  return connections.has(ws);
}, "isWrapped");
var createLazyConnection = /* @__PURE__ */ __name((ws) => {
  if (isWrapped(ws)) return ws;
  let initialState;
  if ("state" in ws) {
    initialState = ws.state;
    delete ws.state;
  }
  const connection = Object.defineProperties(ws, {
    id: {
      configurable: true,
      get() {
        return attachments.get(ws).__pk.id;
      }
    },
    uri: {
      configurable: true,
      get() {
        return attachments.get(ws).__pk.uri ?? null;
      }
    },
    tags: {
      configurable: true,
      get() {
        return attachments.get(ws).__pk.tags ?? [];
      }
    },
    socket: {
      configurable: true,
      get() {
        return ws;
      }
    },
    state: {
      configurable: true,
      get() {
        return ws.deserializeAttachment();
      }
    },
    setState: {
      configurable: true,
      value: /* @__PURE__ */ __name(function setState(setState) {
        let state;
        if (setState instanceof Function) state = setState(this.state);
        else state = setState;
        ws.serializeAttachment(state);
        return state;
      }, "setState")
    },
    deserializeAttachment: {
      configurable: true,
      value: /* @__PURE__ */ __name(function deserializeAttachment() {
        return attachments.get(ws).__user ?? null;
      }, "deserializeAttachment")
    },
    serializeAttachment: {
      configurable: true,
      value: /* @__PURE__ */ __name(function serializeAttachment(attachment) {
        const setting = {
          ...attachments.get(ws),
          __user: attachment ?? null
        };
        attachments.set(ws, setting);
      }, "serializeAttachment")
    }
  });
  if (initialState) connection.setState(initialState);
  connections.add(connection);
  return connection;
}, "createLazyConnection");
var HibernatingConnectionIterator = class {
  static {
    __name(this, "HibernatingConnectionIterator");
  }
  index = 0;
  sockets;
  constructor(state, tag) {
    this.state = state;
    this.tag = tag;
  }
  [Symbol.iterator]() {
    return this;
  }
  next() {
    const sockets = this.sockets ?? (this.sockets = this.state.getWebSockets(this.tag));
    let socket;
    while (socket = sockets[this.index++]) if (socket.readyState === WebSocket.READY_STATE_OPEN) {
      if (!isPartyServerWebSocket(socket)) continue;
      return {
        done: false,
        value: createLazyConnection(socket)
      };
    }
    return {
      done: true,
      value: void 0
    };
  }
};
function prepareTags(connectionId, userTags) {
  const tags = [connectionId, ...userTags.filter((t) => t !== connectionId)];
  if (tags.length > 10) throw new Error("A connection can only have 10 tags, including the default id tag.");
  for (const tag of tags) {
    if (typeof tag !== "string") throw new Error(`A connection tag must be a string. Received: ${tag}`);
    if (tag === "") throw new Error("A connection tag must not be an empty string.");
    if (tag.length > 256) throw new Error("A connection tag must not exceed 256 characters");
  }
  return tags;
}
__name(prepareTags, "prepareTags");
var InMemoryConnectionManager = class {
  static {
    __name(this, "InMemoryConnectionManager");
  }
  #connections = /* @__PURE__ */ new Map();
  tags = /* @__PURE__ */ new WeakMap();
  getCount() {
    return this.#connections.size;
  }
  getConnection(id) {
    return this.#connections.get(id);
  }
  *getConnections(tag) {
    if (!tag) {
      yield* this.#connections.values().filter((c) => c.readyState === WebSocket.READY_STATE_OPEN);
      return;
    }
    for (const connection of this.#connections.values()) if ((this.tags.get(connection) ?? []).includes(tag)) yield connection;
  }
  accept(connection, options) {
    try {
      connection.accept({ allowHalfOpen: true });
    } catch {
      connection.accept();
    }
    try {
      connection.binaryType = "arraybuffer";
    } catch {
    }
    const tags = prepareTags(connection.id, options.tags);
    this.#connections.set(connection.id, connection);
    this.tags.set(connection, tags);
    Object.defineProperty(connection, "tags", {
      get: /* @__PURE__ */ __name(() => tags, "get"),
      configurable: true
    });
    const removeConnection = /* @__PURE__ */ __name(() => {
      this.#connections.delete(connection.id);
      connection.removeEventListener("close", removeConnection);
      connection.removeEventListener("error", removeConnection);
    }, "removeConnection");
    connection.addEventListener("close", removeConnection);
    connection.addEventListener("error", removeConnection);
    return connection;
  }
};
var HibernatingConnectionManager = class {
  static {
    __name(this, "HibernatingConnectionManager");
  }
  constructor(controller) {
    this.controller = controller;
  }
  getCount() {
    let count = 0;
    for (const ws of this.controller.getWebSockets()) if (isPartyServerWebSocket(ws)) count++;
    return count;
  }
  getConnection(id) {
    const matching = this.controller.getWebSockets(id).filter((ws) => {
      return tryGetPartyServerMeta(ws)?.id === id;
    });
    if (matching.length === 0) return void 0;
    if (matching.length === 1) return createLazyConnection(matching[0]);
    throw new Error(`More than one connection found for id ${id}. Did you mean to use getConnections(tag) instead?`);
  }
  getConnections(tag) {
    return new HibernatingConnectionIterator(this.controller, tag);
  }
  accept(connection, options) {
    const tags = prepareTags(connection.id, options.tags);
    this.controller.acceptWebSocket(connection, tags);
    connection.serializeAttachment({
      __pk: {
        id: connection.id,
        tags,
        uri: connection.uri ?? void 0
      },
      __user: null
    });
    return createLazyConnection(connection);
  }
};
var CLOSING = 2;
var CLOSED = 3;
function isBenignTeardownError(ws, error) {
  const state = ws.readyState;
  if (state !== CLOSING && state !== CLOSED) return false;
  if (typeof error !== "object" || error === null) return false;
  const typed = error;
  if (typed.retryable === true) return true;
  const message = typeof typed.message === "string" ? typed.message : "";
  return /Network connection lost|WebSocket peer disconnected/i.test(message);
}
__name(isBenignTeardownError, "isBenignTeardownError");
var NAME_STORAGE_KEY = "__ps_name";
function isReservedCloseCode(code) {
  return code === 1005 || code === 1006 || code === 1015;
}
__name(isReservedCloseCode, "isReservedCloseCode");
function closeQuietly(ws, code, reason) {
  if (isReservedCloseCode(code)) return;
  try {
    ws.close(code, reason);
  } catch {
  }
}
__name(closeQuietly, "closeQuietly");
var serverMapCache = /* @__PURE__ */ new WeakMap();
var bindingNameCache = /* @__PURE__ */ new WeakMap();
var DEFAULT_ROUTING_RETRY_OPTIONS = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 800
};
function durableObjectGetOptions(options) {
  return options?.locationHint ? { locationHint: options.locationHint } : void 0;
}
__name(durableObjectGetOptions, "durableObjectGetOptions");
function validatePositiveInteger(value, name) {
  if (!Number.isFinite(value) || value < 1) throw new Error(`${name} must be >= 1`);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
}
__name(validatePositiveInteger, "validatePositiveInteger");
function validatePositiveNumber(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be > 0`);
}
__name(validatePositiveNumber, "validatePositiveNumber");
function resolveRoutingRetryOptions(options) {
  if (options === false) return null;
  const resolved = {
    maxAttempts: options?.maxAttempts ?? DEFAULT_ROUTING_RETRY_OPTIONS.maxAttempts,
    baseDelayMs: options?.baseDelayMs ?? DEFAULT_ROUTING_RETRY_OPTIONS.baseDelayMs,
    maxDelayMs: options?.maxDelayMs ?? DEFAULT_ROUTING_RETRY_OPTIONS.maxDelayMs,
    onRetry: options?.onRetry
  };
  validatePositiveInteger(resolved.maxAttempts, "routingRetry.maxAttempts");
  validatePositiveNumber(resolved.baseDelayMs, "routingRetry.baseDelayMs");
  validatePositiveNumber(resolved.maxDelayMs, "routingRetry.maxDelayMs");
  if (resolved.baseDelayMs > resolved.maxDelayMs) throw new Error("routingRetry.baseDelayMs must be <= maxDelayMs");
  return resolved;
}
__name(resolveRoutingRetryOptions, "resolveRoutingRetryOptions");
function isRetryableDurableObjectError(error) {
  if (typeof error !== "object" || error === null) return false;
  const typed = error;
  return typed.retryable === true && typed.overloaded !== true;
}
__name(isRetryableDurableObjectError, "isRetryableDurableObjectError");
function routingRetryDelayMs(attempt, options) {
  const upperBoundMs = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** (attempt - 1));
  return Math.floor(Math.random() * upperBoundMs);
}
__name(routingRetryDelayMs, "routingRetryDelayMs");
async function retryDurableObjectOperation(operation, context, retryOptions) {
  const resolved = resolveRoutingRetryOptions(retryOptions);
  if (!resolved) return await operation();
  let attempt = 1;
  while (true) try {
    return await operation();
  } catch (error) {
    const nextAttempt = attempt + 1;
    if (nextAttempt > resolved.maxAttempts || !isRetryableDurableObjectError(error)) throw error;
    const delayMs = routingRetryDelayMs(attempt, resolved);
    try {
      await resolved.onRetry?.({
        error,
        attempt,
        maxAttempts: resolved.maxAttempts,
        delayMs,
        name: context.name,
        className: context.className
      });
    } catch (callbackError) {
      console.warn("PartyServer routingRetry onRetry callback failed:", callbackError);
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    attempt = nextAttempt;
  }
}
__name(retryDurableObjectOperation, "retryDurableObjectOperation");
function encodeProps(props) {
  const bytes = new TextEncoder().encode(JSON.stringify(props));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
__name(encodeProps, "encodeProps");
function decodeProps(header) {
  const trimmed = header.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed);
  const binary = atob(header);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
}
__name(decodeProps, "decodeProps");
function camelCaseToKebabCase(str) {
  if (str === str.toUpperCase() && str !== str.toLowerCase()) return str.toLowerCase().replace(/_/g, "-");
  let kebabified = str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  kebabified = kebabified.startsWith("-") ? kebabified.slice(1) : kebabified;
  return kebabified.replace(/_/g, "-").replace(/-$/, "");
}
__name(camelCaseToKebabCase, "camelCaseToKebabCase");
function resolveCorsHeaders(cors) {
  if (cors === true) return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400"
  };
  if (cors && typeof cors === "object") {
    const h = new Headers(cors);
    const record = {};
    h.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }
  return null;
}
__name(resolveCorsHeaders, "resolveCorsHeaders");
async function routePartykitRequest(req, env$1 = env, options) {
  if (!serverMapCache.has(env$1)) {
    const namespaceMap = {};
    const bindingNames2 = {};
    for (const [k, v] of Object.entries(env$1)) if (v && typeof v === "object" && "idFromName" in v && typeof v.idFromName === "function") {
      const kebab = camelCaseToKebabCase(k);
      namespaceMap[kebab] = v;
      bindingNames2[kebab] = k;
    }
    serverMapCache.set(env$1, namespaceMap);
    bindingNameCache.set(env$1, bindingNames2);
  }
  const map = serverMapCache.get(env$1);
  const bindingNames = bindingNameCache.get(env$1);
  const prefixParts = (options?.prefix || "parties").split("/");
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  if (!prefixParts.every((part, index) => parts[index] === part) || parts.length < prefixParts.length + 2) return null;
  const namespace = parts[prefixParts.length];
  const name = parts[prefixParts.length + 1];
  if (name && namespace) {
    let withCorsHeaders = function(response2) {
      if (!corsHeaders || isWebSocket) return response2;
      const newResponse = new Response(response2.body, response2);
      for (const [key, value] of Object.entries(corsHeaders)) newResponse.headers.set(key, value);
      return newResponse;
    };
    __name(withCorsHeaders, "withCorsHeaders");
    if (!map[namespace]) {
      if (namespace === "main") {
        console.warn("You appear to be migrating a PartyKit project to PartyServer.");
        console.warn(`PartyServer doesn't have a "main" party by default. Try adding this to your PartySocket client:
 
party: "${camelCaseToKebabCase(Object.keys(map)[0])}"`);
      } else console.error(`The url ${req.url}  with namespace "${namespace}" and name "${name}" does not match any server namespace. 
Did you forget to add a durable object binding to the class ${namespace[0].toUpperCase() + namespace.slice(1)} in your wrangler.jsonc?`);
      return new Response("Invalid request", { status: 400 });
    }
    const corsHeaders = resolveCorsHeaders(options?.cors);
    const isWebSocket = req.headers.get("Upgrade")?.toLowerCase() === "websocket";
    if (req.method === "OPTIONS" && corsHeaders) return new Response(null, { headers: corsHeaders });
    let doNamespace = map[namespace];
    if (options?.jurisdiction) doNamespace = doNamespace.jurisdiction(options.jurisdiction);
    const id = doNamespace.idFromName(name);
    const getOptions = durableObjectGetOptions(options);
    req = new Request(req);
    req.headers.set("x-partykit-namespace", namespace);
    if (options?.jurisdiction) req.headers.set("x-partykit-jurisdiction", options.jurisdiction);
    const className = bindingNames[namespace];
    let partyDeprecationWarned = false;
    const lobby = {
      get party() {
        if (!partyDeprecationWarned) {
          partyDeprecationWarned = true;
          console.warn('lobby.party is deprecated and currently returns the kebab-case namespace (e.g. "my-agent"). Use lobby.className instead to get the Durable Object class name (e.g. "MyAgent"). In the next major version, lobby.party will return the class name.');
        }
        return namespace;
      },
      className,
      name
    };
    if (isWebSocket) {
      if (options?.onBeforeConnect) {
        const reqOrRes = await options.onBeforeConnect(req, lobby);
        if (reqOrRes instanceof Request) req = reqOrRes;
        else if (reqOrRes instanceof Response) return reqOrRes;
      }
    } else if (options?.onBeforeRequest) {
      const reqOrRes = await options.onBeforeRequest(req, lobby);
      if (reqOrRes instanceof Request) req = reqOrRes;
      else if (reqOrRes instanceof Response) return withCorsHeaders(reqOrRes);
    }
    if (options?.props !== void 0) req.headers.set("x-partykit-props", encodeProps(options.props));
    const response = await retryDurableObjectOperation(() => doNamespace.get(id, getOptions).fetch(req.clone()), {
      name,
      className
    }, options?.routingRetry);
    return isWebSocket ? response : withCorsHeaders(response);
  } else return null;
}
__name(routePartykitRequest, "routePartykitRequest");
function resolveServerOptions(serverClass) {
  let current = serverClass;
  while (current) {
    const hibernate = current.options?.hibernate;
    if (hibernate !== void 0) return { hibernate };
    current = Object.getPrototypeOf(current);
  }
  return { hibernate: false };
}
__name(resolveServerOptions, "resolveServerOptions");
var Server = class extends DurableObject {
  static {
    __name(this, "Server");
  }
  static options = { hibernate: false };
  #status = "zero";
  #ParentClass = Object.getPrototypeOf(this).constructor;
  #options = resolveServerOptions(this.#ParentClass);
  #connectionManager = this.#options.hibernate ? new HibernatingConnectionManager(this.ctx) : new InMemoryConnectionManager();
  /**
  * Execute SQL queries against the Server's database
  * @template T Type of the returned rows
  * @param strings SQL query template strings
  * @param values Values to be inserted into the query
  * @returns Array of query results
  */
  sql(strings, ...values) {
    let query = "";
    try {
      query = strings.reduce((acc, str, i) => acc + str + (i < values.length ? "?" : ""), "");
      return [...this.ctx.storage.sql.exec(query, ...values)];
    } catch (e) {
      console.error(`failed to execute sql query: ${query}`, e);
      throw this.onException(e);
    }
  }
  constructor(ctx, env2) {
    super(ctx, env2);
  }
  /**
  * Handle incoming requests to the server.
  */
  async fetch(request) {
    try {
      const props = request.headers.get("x-partykit-props");
      if (props) this.#_props = decodeProps(props);
      if (!this.ctx.id.name && !this.#_name) {
        const room = request.headers.get("x-partykit-room");
        if (room) this.#_name = room;
      }
      await this.#ensureInitialized();
      if (!this.ctx.id.name && !this.#_name) throw new Error(`Cannot determine the name for ${this.#ParentClass.name}: this.ctx.id.name is undefined, no legacy __ps_name storage record is present, and no x-partykit-room header was supplied. Likely causes:
  1. The stub was built via idFromString()/newUniqueId(). PartyServer requires name-based addressing (idFromName/getByName).
  2. The workerd/wrangler runtime is too old to expose ctx.id.name \u2014 update to a recent wrangler release.
  3. You called stub.fetch() directly without going through routePartykitRequest()/getServerByName(). Prefer those, or set the x-partykit-room header.`);
      const url = new URL(request.url);
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return await this.onRequest(request);
      else {
        const { 0: clientWebSocket, 1: serverWebSocket } = new WebSocketPair();
        let connectionId = url.searchParams.get("_pk");
        if (!connectionId) connectionId = nanoid();
        let connection = Object.assign(serverWebSocket, {
          id: connectionId,
          uri: request.url,
          server: this.name,
          tags: [],
          state: null,
          setState(setState) {
            let state;
            if (setState instanceof Function) state = setState(this.state);
            else state = setState;
            this.state = state;
            return this.state;
          }
        });
        const ctx = { request };
        const tags = await this.getConnectionTags(connection, ctx);
        connection = this.#connectionManager.accept(connection, { tags });
        if (!this.#options.hibernate) this.#attachSocketEventHandlers(connection);
        await this.onConnect(connection, ctx);
        return new Response(null, {
          status: 101,
          webSocket: clientWebSocket
        });
      }
    } catch (err) {
      console.error(`Error in ${this.#ParentClass.name}:${this.ctx.id.name ?? this.#_name ?? "<unnamed>"} fetch:`, err);
      if (!(err instanceof Error)) throw err;
      if (request.headers.get("Upgrade") === "websocket") {
        const pair = new WebSocketPair();
        pair[1].accept();
        pair[1].send(JSON.stringify({ error: err.stack }));
        pair[1].close(1011, "Uncaught exception during session setup");
        return new Response(null, {
          status: 101,
          webSocket: pair[0]
        });
      } else return new Response(err.stack, { status: 500 });
    }
  }
  async webSocketMessage(ws, message) {
    if (!isPartyServerWebSocket(ws)) return;
    try {
      const connection = createLazyConnection(ws);
      await this.#ensureInitialized();
      connection.server = this.name;
      return this.onMessage(connection, message);
    } catch (e) {
      console.error(`Error in ${this.#ParentClass.name}:${this.ctx.id.name ?? this.#_name ?? "<unnamed>"} webSocketMessage:`, e);
    }
  }
  async webSocketClose(ws, code, reason, wasClean) {
    if (!isPartyServerWebSocket(ws)) return;
    try {
      const connection = createLazyConnection(ws);
      await this.#ensureInitialized();
      connection.server = this.name;
      await this.onClose(connection, code, reason, wasClean);
    } catch (e) {
      console.error(`Error in ${this.#ParentClass.name}:${this.ctx.id.name ?? this.#_name ?? "<unnamed>"} webSocketClose:`, e);
    } finally {
      closeQuietly(ws, code, reason);
    }
  }
  async webSocketError(ws, error) {
    if (!isPartyServerWebSocket(ws)) return;
    if (isBenignTeardownError(ws, error)) return;
    try {
      const connection = createLazyConnection(ws);
      await this.#ensureInitialized();
      connection.server = this.name;
      return this.onError(connection, error);
    } catch (e) {
      console.error(`Error in ${this.#ParentClass.name}:${this.ctx.id.name ?? this.#_name ?? "<unnamed>"} webSocketError:`, e);
    }
  }
  /**
  * Read the legacy `__ps_name` storage record as a fallback source of
  * `this.name` when `ctx.id.name` is unavailable. Covers:
  *
  *   1. Alarm handlers firing on alarm records that were scheduled by
  *      a workerd version that did not yet persist `name` into the
  *      alarm record (see the Durable Objects ID docs:
  *      https://developers.cloudflare.com/durable-objects/api/id/#name).
  *      The runtime contract for current workerd populates `ctx.id.name`
  *      in alarm handlers — see the "Raw runtime contract" tests — so
  *      this fallback exists primarily for stale on-disk alarm records
  *      and for defense-in-depth against future runtime changes.
  *   2. Legacy framework-level bootstrap patterns that write
  *      `__ps_name` directly (or call `setName()`) before triggering
  *      `__unsafe_ensureInitialized()` — typically DOs addressed via
  *      `idFromString()` / `newUniqueId()` plus a name override.
  */
  async #hydrateNameFromLegacyStorage() {
    if (this.#_name) return;
    const stored = await this.ctx.storage.get(NAME_STORAGE_KEY);
    if (stored) this.#_name = stored;
  }
  async #persistNameFallbackFromCtxId() {
    const ctxName = this.ctx.id.name;
    if (ctxName === void 0 || this.#_name) return;
    if (await this.ctx.storage.get(NAME_STORAGE_KEY) !== ctxName) await this.ctx.storage.put(NAME_STORAGE_KEY, ctxName);
    this.#_name = ctxName;
  }
  /**
  * @internal — Do not use directly. This is an escape hatch for frameworks
  * (like Agents) that receive calls via native DO RPC, bypassing the
  * standard fetch/alarm/webSocket entry points where initialization
  * normally happens. Calling this from application code is unsupported
  * and may break without notice.
  */
  async __unsafe_ensureInitialized() {
    await this.#ensureInitialized();
  }
  async #ensureInitialized() {
    if (this.#status === "started") return;
    if (this.ctx.id.name !== void 0) await this.#persistNameFallbackFromCtxId();
    else if (!this.#_name) await this.#hydrateNameFromLegacyStorage();
    let error;
    await this.ctx.blockConcurrencyWhile(async () => {
      this.#status = "starting";
      try {
        await this.onStart(this.#_props);
        this.#status = "started";
      } catch (e) {
        this.#status = "zero";
        error = e;
      }
    });
    if (error) throw error;
  }
  #attachSocketEventHandlers(connection) {
    const handleMessageFromClient = /* @__PURE__ */ __name((event) => {
      this.onMessage(connection, event.data)?.catch((e) => {
        console.error("onMessage error:", e);
      });
    }, "handleMessageFromClient");
    const reciprocateClose = /* @__PURE__ */ __name((event) => {
      closeQuietly(connection, event.code, event.reason);
    }, "reciprocateClose");
    const handleCloseFromClient = /* @__PURE__ */ __name((event) => {
      connection.removeEventListener("message", handleMessageFromClient);
      connection.removeEventListener("close", handleCloseFromClient);
      let result;
      try {
        result = this.onClose(connection, event.code, event.reason, event.wasClean);
      } catch (e) {
        console.error("onClose error:", e);
        reciprocateClose(event);
        return;
      }
      if (result && typeof result.then === "function") result.catch((e) => {
        console.error("onClose error:", e);
      }).finally(() => reciprocateClose(event));
      else reciprocateClose(event);
    }, "handleCloseFromClient");
    const handleErrorFromClient = /* @__PURE__ */ __name((e) => {
      connection.removeEventListener("message", handleMessageFromClient);
      connection.removeEventListener("error", handleErrorFromClient);
      if (isBenignTeardownError(connection, e.error)) return;
      this.onError(connection, e.error)?.catch((err) => {
        console.error("onError error:", err);
      });
    }, "handleErrorFromClient");
    connection.addEventListener("close", handleCloseFromClient);
    connection.addEventListener("error", handleErrorFromClient);
    connection.addEventListener("message", handleMessageFromClient);
  }
  #_name;
  /**
  * The name for this server.
  *
  * Resolves from `this.ctx.id.name` — the native DO id name, populated
  * whenever the stub was created via `idFromName()` or `getByName()`.
  * This is available inside every entry point (including the constructor,
  * alarms, and hibernating websocket handlers).
  *
  * For alarm handlers firing on stale on-disk alarm records from
  * older workerd versions that didn't persist `name` into the alarm
  * record, the name is recovered from a storage fallback record.
  *
  * Throws if neither source is available — typically this means the DO
  * was addressed via `idFromString()` or `newUniqueId()`, which is not
  * supported by PartyServer.
  */
  get name() {
    const ctxName = this.ctx.id.name;
    if (ctxName !== void 0) return ctxName;
    if (this.#_name) return this.#_name;
    throw new Error(`Attempting to read .name on ${this.#ParentClass.name}, but this.ctx.id.name is not set and no ${NAME_STORAGE_KEY} fallback record is available. PartyServer requires DOs to be addressed via idFromName()/getByName(), or explicitly bootstrapped with setName() when using idFromString()/newUniqueId(). If this happens in an alarm handler firing on a stale alarm record, initialize the DO from a fetch/RPC entry point first so PartyServer can persist the fallback name.`);
  }
  /**
  * Establish this server's name and trigger `onStart()`.
  *
  * Use cases:
  *
  *   1. **Framework-level bootstrap of DOs where `ctx.id.name` is
  *      undefined** — e.g. DOs addressed via `idFromString()` /
  *      `newUniqueId()`. `setName()` stashes the name in memory and
  *      persists it under `__ps_name` so cold-wake invocations
  *      recover it via `#ensureInitialized()`'s legacy fallback.
  *   2. **Delivering initial `props` to `onStart()`** via the
  *      optional second argument.
  *
  * For DOs addressed via `idFromName()` / `getByName()`, calling
  * `setName()` is redundant — `this.name` is available automatically
  * from `ctx.id.name`. The normal initialization path also persists
  * a fallback record so old-compat alarm handlers can recover the name.
  * Throws if `name` does not match `ctx.id.name`.
  *
  * **Not appropriate for facets.** Cloudflare Agents and any other
  * framework using `ctx.facets.get(...)` should pass an explicit
  * `id` in `FacetStartupOptions` so the facet has its own
  * `ctx.id.name`:
  *
  * ```ts
  * const stub = ctx.facets.get(facetKey, () => ({
  *   class: ChildClass,
  *   id: ctx.exports.SomeBoundDOClass.idFromName(facetName),
  * }));
  * ```
  *
  * Without an explicit `id`, the facet inherits the parent DO's
  * `ctx.id` (including `ctx.id.name`), and `setName()` will throw
  * the ctx.id.name-mismatch error because the facet's intended
  * name differs from the parent's. See
  * https://developers.cloudflare.com/dynamic-workers/usage/durable-object-facets/
  * for the `FacetStartupOptions.id` semantics.
  *
  * @deprecated for callers that address DOs via `idFromName()` /
  * `getByName()`. Still the supported API for framework-level
  * bootstrap of header/`newUniqueId`-addressed DOs and for
  * delivering initial `props` to `onStart()`.
  */
  async setName(name, props) {
    if (!name) throw new Error("A name is required.");
    const ctxName = this.ctx.id.name;
    if (ctxName !== void 0 && ctxName !== name) throw new Error(`This server's Durable Object id was created for name "${ctxName}", cannot setName to "${name}".`);
    if (this.#_name && this.#_name !== name) throw new Error(`This server already has a name: ${this.#_name}, attempting to set to: ${name}`);
    if (props !== void 0) this.#_props = props;
    if (!this.#_name && ctxName === void 0) {
      await this.ctx.storage.put(NAME_STORAGE_KEY, name);
      this.#_name = name;
    }
    await this.#ensureInitialized();
  }
  /**
  * @internal
  * @deprecated Retained for backward compatibility with older callers.
  * `routePartykitRequest` no longer uses this method; it sends props via
  * the `x-partykit-props` header on the underlying `fetch()` request.
  */
  async _initAndFetch(name, props, request) {
    await this.setName(name, props);
    return this.fetch(request);
  }
  #sendMessageToConnection(connection, message) {
    try {
      connection.send(message);
    } catch (_e) {
      connection.close(1011, "Unexpected error");
    }
  }
  /** Send a message to all connected clients, except connection ids listed in `without` */
  broadcast(msg, without) {
    for (const connection of this.#connectionManager.getConnections()) if (!without || !without.includes(connection.id)) this.#sendMessageToConnection(connection, msg);
  }
  /** Get a connection by connection id */
  getConnection(id) {
    return this.#connectionManager.getConnection(id);
  }
  /**
  * Get all connections. Optionally, you can provide a tag to filter returned connections.
  * Use `Server#getConnectionTags` to tag the connection on connect.
  */
  getConnections(tag) {
    return this.#connectionManager.getConnections(tag);
  }
  /**
  * You can tag a connection to filter them in Server#getConnections.
  * Each connection supports up to 9 tags, each tag max length is 256 characters.
  */
  getConnectionTags(connection, context) {
    return [];
  }
  #_props;
  /**
  * Called when the server is started for the first time.
  */
  onStart(props) {
  }
  /**
  * Called when a new connection is made to the server.
  */
  onConnect(connection, ctx) {
  }
  /**
  * Called when a message is received from a connection.
  */
  onMessage(connection, message) {
  }
  /**
  * Called when a connection is closed.
  */
  onClose(connection, code, reason, wasClean) {
  }
  /**
  * Called when an error occurs on a connection.
  */
  onError(connection, error) {
    console.error(`Error on connection ${connection.id} in ${this.#ParentClass.name}:${this.name}:`, error);
    console.info(`Implement onError on ${this.#ParentClass.name} to handle this error.`);
  }
  /**
  * Called when a request is made to the server.
  */
  onRequest(request) {
    console.warn(`onRequest hasn't been implemented on ${this.#ParentClass.name}:${this.name} responding to ${request.url}`);
    return new Response("Not implemented", { status: 404 });
  }
  /**
  * Called when an exception occurs.
  * @param error - The error that occurred.
  */
  onException(error) {
    console.error(`Exception in ${this.#ParentClass.name}:${this.name}:`, error);
    console.info(`Implement onException on ${this.#ParentClass.name} to handle this error.`);
  }
  onAlarm() {
    console.log(`Implement onAlarm on ${this.#ParentClass.name} to handle alarms.`);
  }
  async alarm() {
    await this.#ensureInitialized();
    await this.onAlarm();
  }
};

// ../../packages/game-core/src/colors.ts
var PLAYER_COLOR_PALETTE = [
  "#D3773F",
  // primary (rust orange)
  "#74B9FF",
  // sky
  "#AAC573",
  // secondary (olive)
  "#A29BFE",
  // lavender
  "#FF6B6B",
  // coral
  "#55EFC4",
  // mint
  "#F8E71C",
  // yellow
  "#E84393"
  // pink
];
var FALLBACK_TEAM_COLORS = [
  "#74B9FF",
  // sky — team 1
  "#D3773F"
  // primary — team 2
];
var MAX_PLAYERS = 8;
var MIN_PLAYERS = 2;
function assignDefaultColors(playerCount, offset = 0) {
  const count = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, playerCount));
  return Array.from(
    { length: count },
    (_, i) => PLAYER_COLOR_PALETTE[(offset + i) % PLAYER_COLOR_PALETTE.length]
  );
}
__name(assignDefaultColors, "assignDefaultColors");
function reconcileColors(playerCount, existing, offset = 0) {
  const defaults = assignDefaultColors(playerCount, offset);
  if (!existing) return defaults;
  const result = [];
  for (let i = 0; i < playerCount; i++) {
    const color = existing[i];
    result.push(color && PLAYER_COLOR_PALETTE.includes(color) ? color : defaults[i]);
  }
  return result;
}
__name(reconcileColors, "reconcileColors");

// ../../packages/game-core/src/pickers.ts
function pickRandomSpectrum(pool, usedIndices) {
  let available = pool.map((s, i) => ({ s, i })).filter(({ i }) => !usedIndices.includes(i));
  if (available.length === 0) {
    available = pool.map((s, i) => ({ s, i }));
  }
  const pick = available[Math.floor(Math.random() * available.length)];
  return { spectrum: pick.s, index: pick.i };
}
__name(pickRandomSpectrum, "pickRandomSpectrum");
function randomTargetAngle() {
  return Math.floor(Math.random() * 150) + 15;
}
__name(randomTargetAngle, "randomTargetAngle");
function buildSpectrumPool(baseSpectrums, customSpectrums) {
  return [...baseSpectrums, ...customSpectrums];
}
__name(buildSpectrumPool, "buildSpectrumPool");
function buildAllGuessQueue(activeIndex, n) {
  return Array.from({ length: n - 1 }, (_, i) => (activeIndex + 1 + i) % n);
}
__name(buildAllGuessQueue, "buildAllGuessQueue");
function weightedPick(weights, excludeIndex) {
  const indices = weights.map((_, i) => i).filter((i) => i !== excludeIndex);
  const total = indices.reduce((s, i) => s + weights[i], 0);
  if (total <= 0) return indices[Math.floor(Math.random() * indices.length)];
  let r = Math.random() * total;
  for (const i of indices) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return indices[indices.length - 1];
}
__name(weightedPick, "weightedPick");
function rollRoles(playCounts) {
  const weights = playCounts.map((c) => 1 / (1 + c));
  const cluer = weightedPick(weights);
  const guesser = weightedPick(weights, cluer);
  return { cluer, guesser };
}
__name(rollRoles, "rollRoles");
function computeAvgDiffs(roundHistory, numSides2) {
  const sums = Array(numSides2).fill(0);
  const counts = Array(numSides2).fill(0);
  for (const r of roundHistory) {
    if (Array.isArray(r.guesses) && r.guesses.length > 0) {
      for (const g of r.guesses) {
        if (g.playerIndex < numSides2) {
          sums[g.playerIndex] += Math.abs(r.targetAngle - g.angle);
          counts[g.playerIndex]++;
        }
      }
    } else if (r.guesser < numSides2) {
      sums[r.guesser] += Math.abs(r.targetAngle - r.guessAngle);
      counts[r.guesser]++;
    }
  }
  return sums.map((s, i) => counts[i] > 0 ? s / counts[i] : Number.POSITIVE_INFINITY);
}
__name(computeAvgDiffs, "computeAvgDiffs");

// ../../packages/game-core/src/scoring.ts
var SCORE_ZONES = {
  zone4: { threshold: 12, points: 4 },
  // bullseye
  zone3: { threshold: 24, points: 3 },
  // close
  zone2: { threshold: 36, points: 2 }
  // near
};
function calculateScore(targetAngle, guessAngle) {
  const diff = Math.abs(targetAngle - guessAngle);
  if (diff <= SCORE_ZONES.zone4.threshold) return SCORE_ZONES.zone4.points;
  if (diff <= SCORE_ZONES.zone3.threshold) return SCORE_ZONES.zone3.points;
  if (diff <= SCORE_ZONES.zone2.threshold) return SCORE_ZONES.zone2.points;
  return 0;
}
__name(calculateScore, "calculateScore");

// ../../packages/game-core/src/reducer.ts
function numSides(state) {
  return state.gameMode === "individual" ? state.playerNames.length : 2;
}
__name(numSides, "numSides");
function usesSelection(state) {
  return state.gameMode === "individual" && state.roundFlow === "single-guess" && state.playerNames.length >= 3;
}
__name(usesSelection, "usesSelection");
function createInitialState(settings, baseSpectrums) {
  const pool = buildSpectrumPool(baseSpectrums, settings.customSpectrums);
  const { spectrum, index } = pickRandomSpectrum(pool, []);
  const skips = settings.skipsPerPlayer;
  const isIndividual = settings.gameMode === "individual";
  const playerNames = isIndividual ? [...settings.playerNames] : [];
  const numPlayers = isIndividual ? playerNames.length : 2;
  const playerColors = isIndividual ? reconcileColors(numPlayers, settings.playerColors) : [];
  const useSelection = isIndividual && settings.roundFlow === "single-guess" && numPlayers >= 3;
  let initialQueue;
  if (!isIndividual) {
    initialQueue = [0];
  } else if (numPlayers === 2) {
    initialQueue = [1];
  } else if (settings.roundFlow === "all-guess") {
    initialQueue = buildAllGuessQueue(0, numPlayers);
  } else {
    initialQueue = [];
  }
  return {
    gameMode: settings.gameMode,
    scoringTarget: settings.scoringTarget,
    roundFlow: settings.roundFlow,
    phase: useSelection ? "selection" : "clue",
    round: 1,
    activeSideIndex: 0,
    scores: Array(numPlayers).fill(0),
    playerNames,
    playerColors,
    playCounts: Array(numPlayers).fill(0),
    targetAngle: randomTargetAngle(),
    guessAngle: 90,
    currentSpectrum: spectrum,
    usedIndices: [index],
    lastRoundScore: 0,
    skipsRemaining: Array(numPlayers).fill(skips),
    winningScore: settings.winningScore,
    allSpectrums: pool,
    roundHistory: [],
    guessQueue: initialQueue,
    currentGuesserIndex: initialQueue[0] ?? null,
    roundGuesses: [],
    teamNames: [settings.teams[0].name, settings.teams[1].name],
    teamColors: [
      settings.teams[0].color ?? FALLBACK_TEAM_COLORS[0],
      settings.teams[1].color ?? FALLBACK_TEAM_COLORS[1]
    ],
    teamPlayers: [settings.teams[0].players, settings.teams[1].players],
    clueGiverIndices: [0, 0]
  };
}
__name(createInitialState, "createInitialState");
function getClueGiverName(state) {
  if (state.gameMode === "individual") {
    return state.playerNames[state.activeSideIndex] ?? "";
  }
  const teamIdx = state.activeSideIndex;
  const playerIdx = state.clueGiverIndices[teamIdx];
  return state.teamPlayers[teamIdx]?.[playerIdx] ?? "";
}
__name(getClueGiverName, "getClueGiverName");
function getGuesserName(state) {
  if (state.gameMode === "individual") {
    if (state.currentGuesserIndex == null) return "";
    return state.playerNames[state.currentGuesserIndex] ?? "";
  }
  const teamIdx = state.activeSideIndex;
  const teamPlayers = state.teamPlayers[teamIdx] ?? [];
  if (teamPlayers.length < 2) return "";
  const cluerIdx = state.clueGiverIndices[teamIdx] ?? 0;
  const guesserIdx = (cluerIdx + 1) % teamPlayers.length;
  return teamPlayers[guesserIdx] ?? "";
}
__name(getGuesserName, "getGuesserName");
function gameReducer(state, action) {
  switch (action.type) {
    case "START_GAME":
      return createInitialState(action.settings, state.allSpectrums);
    case "SUBMIT_CLUE":
      return { ...state, phase: "guess" };
    case "SUBMIT_GUESS": {
      const guesserIdx = state.currentGuesserIndex ?? 0;
      const score = calculateScore(state.targetAngle, action.guessAngle);
      const newRoundGuesses = [
        ...state.roundGuesses,
        { playerIndex: guesserIdx, angle: action.guessAngle, score }
      ];
      const moreGuessers = state.guessQueue.length > 1;
      if (moreGuessers) {
        const newQueue = state.guessQueue.slice(1);
        return {
          ...state,
          roundGuesses: newRoundGuesses,
          guessQueue: newQueue,
          currentGuesserIndex: newQueue[0] ?? null,
          guessAngle: 90,
          phase: "pass",
          lastRoundScore: score
        };
      }
      const newScores = [...state.scores];
      const isAllGuess = state.gameMode === "individual" && state.roundFlow === "all-guess" && state.playerNames.length >= 3;
      let cluerBonus = 0;
      if (isAllGuess) {
        for (const g of newRoundGuesses) {
          if (g.playerIndex < newScores.length) {
            newScores[g.playerIndex] += g.score;
          }
          if (g.score > 0) cluerBonus++;
        }
        if (state.activeSideIndex < newScores.length) {
          newScores[state.activeSideIndex] += cluerBonus;
        }
      } else {
        const onlyGuess = newRoundGuesses[0];
        const scorerIdx = state.scoringTarget === "cluer" ? state.activeSideIndex : onlyGuess.playerIndex;
        if (scorerIdx < newScores.length) {
          newScores[scorerIdx] += onlyGuess.score;
        }
      }
      const isGameOver = newScores.some((s) => s >= state.winningScore);
      const firstGuess = newRoundGuesses[0];
      const record = {
        round: state.round,
        spectrum: state.currentSpectrum,
        targetAngle: state.targetAngle,
        guessAngle: firstGuess.angle,
        score: isAllGuess ? cluerBonus : firstGuess.score,
        clueGiver: state.activeSideIndex,
        guesser: firstGuess.playerIndex,
        clueGiverName: getClueGiverName(state),
        guesserName: state.gameMode === "teams" ? getGuesserName(state) : void 0,
        teamName: state.gameMode === "teams" ? state.teamNames[state.activeSideIndex] : void 0,
        guesses: newRoundGuesses.length > 1 ? newRoundGuesses : void 0,
        cluerBonus: isAllGuess ? cluerBonus : void 0
      };
      return {
        ...state,
        phase: isGameOver ? "gameover" : "result",
        guessAngle: action.guessAngle,
        scores: newScores,
        lastRoundScore: isAllGuess ? Math.max(0, ...newRoundGuesses.map((g) => g.score)) : firstGuess.score,
        roundGuesses: newRoundGuesses,
        roundHistory: [...state.roundHistory, record]
      };
    }
    case "DISMISS_PASS":
      return { ...state, phase: "guess" };
    case "NEXT_ROUND": {
      const { spectrum, index } = pickRandomSpectrum(state.allSpectrums, state.usedIndices);
      const isIndividual = state.gameMode === "individual";
      const n = numSides(state);
      const newClueGiverIndices = [...state.clueGiverIndices];
      let nextActive = state.activeSideIndex;
      let newQueue = [];
      if (!isIndividual) {
        nextActive = state.activeSideIndex === 0 ? 1 : 0;
        newQueue = [nextActive];
        const prevTeamIdx = state.activeSideIndex;
        const teamSize = state.teamPlayers[prevTeamIdx].length;
        if (teamSize > 0) {
          newClueGiverIndices[prevTeamIdx] = (state.clueGiverIndices[prevTeamIdx] + 1) % teamSize;
        }
      } else if (n === 2) {
        nextActive = state.activeSideIndex === 0 ? 1 : 0;
        newQueue = [nextActive === 0 ? 1 : 0];
      } else if (state.roundFlow === "all-guess") {
        nextActive = (state.activeSideIndex + 1) % n;
        newQueue = buildAllGuessQueue(nextActive, n);
      } else {
        newQueue = [];
      }
      const goesToSelection = usesSelection(state) && n >= 3;
      return {
        ...state,
        phase: goesToSelection ? "selection" : "clue",
        round: state.round + 1,
        activeSideIndex: nextActive,
        targetAngle: randomTargetAngle(),
        guessAngle: 90,
        currentSpectrum: spectrum,
        usedIndices: [...state.usedIndices, index],
        lastRoundScore: 0,
        clueGiverIndices: newClueGiverIndices,
        guessQueue: newQueue,
        currentGuesserIndex: newQueue[0] ?? null,
        roundGuesses: []
      };
    }
    case "ROLL_ROLES": {
      const newPlayCounts = [...state.playCounts];
      if (action.cluer < newPlayCounts.length) newPlayCounts[action.cluer]++;
      if (action.guesser < newPlayCounts.length) newPlayCounts[action.guesser]++;
      return {
        ...state,
        phase: "clue",
        activeSideIndex: action.cluer,
        guessQueue: [action.guesser],
        currentGuesserIndex: action.guesser,
        playCounts: newPlayCounts
      };
    }
    case "SKIP_ROUND": {
      const cluerIdx = state.activeSideIndex;
      const remaining = state.skipsRemaining[cluerIdx] ?? 0;
      if (remaining === 0) return state;
      const newSkips = [...state.skipsRemaining];
      if (remaining > 0) newSkips[cluerIdx] = remaining - 1;
      const { spectrum, index } = pickRandomSpectrum(state.allSpectrums, state.usedIndices);
      return {
        ...state,
        targetAngle: randomTargetAngle(),
        currentSpectrum: spectrum,
        usedIndices: [...state.usedIndices, index],
        skipsRemaining: newSkips
      };
    }
    case "SET_LOCALE_POOL":
      return {
        ...state,
        allSpectrums: action.pool,
        usedIndices: []
      };
    default:
      return state;
  }
}
__name(gameReducer, "gameReducer");

// src/server.ts
var HOST_DISCONNECT_GRACE_MS = 1e4;
var SintoniaRoom = class extends Server {
  static {
    __name(this, "SintoniaRoom");
  }
  // playerId → member (one persistent ID across reconnects)
  members = /* @__PURE__ */ new Map();
  hostPlayerId = null;
  game = null;
  hostGraceTimer = null;
  // Last room config pushed by the host. Synced to all clients so guests can
  // preview the match settings. Reset when the room is cleared.
  roomConfig = null;
  /** Pre-game countdown — set by START_GAME, cleared when game.state init runs. */
  gameStartingAt = null;
  gameStartTimer = null;
  pendingStart = null;
  clearHostGraceTimer() {
    if (this.hostGraceTimer) {
      clearTimeout(this.hostGraceTimer);
      this.hostGraceTimer = null;
    }
  }
  closeRoomBroadcast() {
    this.broadcast(
      this.encodeServerMessage({ type: "ROOM_CLOSED", reason: "host" })
    );
    for (const c of this.getConnections()) {
      try {
        c.close();
      } catch {
      }
    }
    this.members.clear();
    this.hostPlayerId = null;
    this.game = null;
    this.clearHostGraceTimer();
  }
  // ---------- Lifecycle ----------
  onConnect(conn) {
    conn.send(this.encodeServerMessage({ type: "STATE", state: this.publicState() }));
  }
  onMessage(sender, rawMessage) {
    let message;
    try {
      message = JSON.parse(rawMessage);
    } catch {
      this.sendError(sender, "BAD_REQUEST", "Invalid JSON.");
      return;
    }
    switch (message.type) {
      case "JOIN":
        return this.handleJoin(sender, message);
      case "LEAVE":
        return this.handleLeave(sender);
      case "READY":
        return this.handleReady(sender, message.isReady);
      case "START_GAME":
        return this.handleStartGame(sender, message);
      case "SUBMIT_CLUE_TEXT":
        return this.handleSubmitClueText(sender, message.text);
      case "CLUE_SAID":
        return this.handleClueSaid(sender);
      case "SUBMIT_GUESS":
        return this.handleSubmitGuess(sender, message.angle);
      case "SKIP_CARD":
        return this.handleSkipCard(sender);
      case "READY_NEXT_ROUND":
        return this.handleReadyNextRound(sender);
      case "CLOSE_ROOM":
        return this.handleCloseRoom(sender);
      case "KICK_PLAYER":
        return this.handleKickPlayer(sender, message.targetPlayerId);
      case "RETURN_TO_LOBBY":
        return this.handleReturnToLobby(sender);
      case "UPDATE_ROOM_SETTINGS":
        return this.handleUpdateRoomSettings(sender, message.config);
      default:
        this.sendError(sender, "BAD_REQUEST", `Unsupported: ${message.type}`);
        return;
    }
  }
  onClose(conn) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) return;
    member.connected = false;
    if (member.playerId === this.hostPlayerId) {
      this.clearHostGraceTimer();
      this.hostGraceTimer = setTimeout(() => {
        const stillHost = this.hostPlayerId === member.playerId;
        const stillDisconnected = !this.members.get(member.playerId)?.connected;
        if (stillHost && stillDisconnected) {
          this.closeRoomBroadcast();
        }
      }, HOST_DISCONNECT_GRACE_MS);
    }
    this.handlePlayerGoneMidGame(member.playerId, false);
    this.broadcastState();
  }
  // ---------- Lobby handlers ----------
  handleJoin(conn, message) {
    const { code, playerId, name, color, mode } = message;
    const expectedCode = this.name.toUpperCase();
    if (code.toUpperCase() !== expectedCode) {
      this.sendError(conn, "INVALID_CODE", `Room code mismatch (room is ${expectedCode}).`);
      return;
    }
    const existing = this.members.get(playerId);
    if (!existing && mode === "guest" && this.members.size === 0) {
      this.sendError(
        conn,
        "INVALID_CODE",
        "Essa sala n\xE3o existe (ou j\xE1 foi encerrada)."
      );
      return;
    }
    if (existing) {
      existing.connectionId = conn.id;
      existing.connected = true;
      existing.name = name;
      existing.color = color;
      if (playerId === this.hostPlayerId) {
        this.clearHostGraceTimer();
      }
    } else {
      const isFirst = this.members.size === 0;
      if (isFirst) this.hostPlayerId = playerId;
      this.members.set(playerId, {
        connectionId: conn.id,
        playerId,
        name,
        color,
        connected: true,
        isHost: isFirst,
        isReady: false
      });
    }
    if (this.game && this.isCluer(playerId)) {
      conn.send(this.encodeServerMessage({
        type: "PRIVATE_TARGET",
        angle: this.game.state.targetAngle
      }));
    }
    this.broadcastState();
  }
  handleUpdateRoomSettings(conn, config) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) {
      this.sendError(conn, "BAD_REQUEST", "Join the room first.");
      return;
    }
    if (member.playerId !== this.hostPlayerId) {
      this.sendError(conn, "NOT_HOST", "Only the host can change room settings.");
      return;
    }
    if (this.game) {
      return;
    }
    this.roomConfig = {
      voiceMode: !!config.voiceMode,
      winningScore: Number(config.winningScore) || 10,
      skipsPerPlayer: Number(config.skipsPerPlayer) ?? 0,
      clueTimeLimit: Number(config.clueTimeLimit) ?? -1,
      guessTimeLimit: Number(config.guessTimeLimit) ?? -1
    };
    this.broadcastState();
  }
  handleReturnToLobby(conn) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) {
      this.sendError(conn, "BAD_REQUEST", "Join the room first.");
      return;
    }
    if (member.playerId !== this.hostPlayerId) {
      this.sendError(conn, "NOT_HOST", "Only the host can return to lobby.");
      return;
    }
    if (!this.game) {
      return;
    }
    if (this.game.state.phase !== "gameover") {
      this.sendError(conn, "WRONG_PHASE", "Only allowed after the game ends.");
      return;
    }
    if (this.game.phaseTimer) clearTimeout(this.game.phaseTimer);
    this.game = null;
    this.broadcastState();
  }
  handleKickPlayer(conn, targetPlayerId) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) {
      this.sendError(conn, "BAD_REQUEST", "Join the room first.");
      return;
    }
    if (member.playerId !== this.hostPlayerId) {
      this.sendError(conn, "NOT_HOST", "Only the host can kick players.");
      return;
    }
    if (targetPlayerId === this.hostPlayerId) {
      this.sendError(conn, "BAD_REQUEST", "Host can't kick themselves.");
      return;
    }
    const target = this.members.get(targetPlayerId);
    if (!target) {
      this.sendError(conn, "BAD_REQUEST", "Player not in this room.");
      return;
    }
    for (const c of this.getConnections()) {
      if (c.id === target.connectionId) {
        try {
          c.send(this.encodeServerMessage({ type: "KICKED" }));
        } catch {
        }
        try {
          c.close();
        } catch {
        }
        break;
      }
    }
    this.members.delete(targetPlayerId);
    this.broadcastState();
  }
  handleCloseRoom(conn) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) {
      this.sendError(conn, "BAD_REQUEST", "Join the room first.");
      return;
    }
    if (member.playerId !== this.hostPlayerId) {
      this.sendError(conn, "NOT_HOST", "Only the host can close the room.");
      return;
    }
    this.closeRoomBroadcast();
  }
  handleLeave(conn) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) return;
    this.members.delete(member.playerId);
    if (member.playerId === this.hostPlayerId) {
      const next = this.members.values().next().value;
      this.hostPlayerId = next?.playerId ?? null;
      if (next) next.isHost = true;
    }
    if (this.members.size === 0) this.game = null;
    this.handlePlayerGoneMidGame(member.playerId, true);
    this.broadcastState();
  }
  // Called when a seated player either explicitly leaves or drops their
  // connection. `permanent=true` means LEAVE (member removed from list);
  // permanent=false means transient disconnect (member still seated, may
  // reconnect). Transient disconnects only relax the guess-phase wait —
  // we don't force the clue forward, otherwise a brief wifi blip could
  // skip the cluer's turn.
  handlePlayerGoneMidGame(playerId, permanent) {
    if (!this.game) return;
    const wasCluer = this.game.playerIdByIndex[this.game.state.activeSideIndex] === playerId;
    if (permanent && this.game.state.phase === "clue" && wasCluer) {
      if (!this.game.voiceMode && !this.game.clueText) {
        this.game.clueText = "(sem dica)";
      }
      this.game.state = gameReducer(this.game.state, { type: "SUBMIT_CLUE" });
      this.scheduleDeadlineForCurrentPhase();
    }
    this.game.pendingGuesses.delete(playerId);
    this.tryFlushAllGuesses();
  }
  handleReady(conn, isReady) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) return;
    member.isReady = isReady;
    this.broadcastState();
  }
  // ---------- Game handlers ----------
  handleStartGame(conn, message) {
    const member = this.findMemberByConnection(conn.id);
    if (!member) {
      this.sendError(conn, "BAD_REQUEST", "Join the room first.");
      return;
    }
    if (member.playerId !== this.hostPlayerId) {
      this.sendError(conn, "NOT_HOST", "Only the host can start the game.");
      return;
    }
    if (this.game) {
      if (this.game.state.phase !== "gameover") {
        this.sendError(conn, "ALREADY_STARTED", "A game is already in progress.");
        return;
      }
      if (this.game.phaseTimer) clearTimeout(this.game.phaseTimer);
      this.game = null;
    }
    const connectedMembers = [...this.members.values()].filter((m) => m.connected);
    if (connectedMembers.length < 2) {
      this.sendError(conn, "BAD_REQUEST", "Need at least 2 connected players.");
      return;
    }
    if (message.settings.gameMode === "teams") {
      this.sendError(conn, "BAD_REQUEST", "Teams mode is not yet supported online.");
      return;
    }
    if (!Array.isArray(message.spectrumPool) || message.spectrumPool.length === 0) {
      this.sendError(conn, "BAD_REQUEST", "Empty spectrum pool.");
      return;
    }
    const ordered = [
      connectedMembers.find((m) => m.playerId === this.hostPlayerId),
      ...connectedMembers.filter((m) => m.playerId !== this.hostPlayerId)
    ];
    const playerIdByIndex = ordered.map((m) => m.playerId);
    const settings = {
      ...message.settings,
      gameMode: "individual",
      playerNames: ordered.map((m) => m.name),
      playerColors: ordered.map((m) => m.color)
    };
    const PRE_GAME_MS = 3e3;
    this.pendingStart = { settings, voiceMode: message.voiceMode, spectrumPool: message.spectrumPool };
    this.gameStartingAt = Date.now() + PRE_GAME_MS;
    if (this.gameStartTimer) clearTimeout(this.gameStartTimer);
    this.gameStartTimer = setTimeout(() => {
      this.commitPendingStart(playerIdByIndex);
    }, PRE_GAME_MS);
    this.broadcastState();
  }
  commitPendingStart(playerIdByIndex) {
    if (!this.pendingStart) return;
    const { settings, voiceMode, spectrumPool } = this.pendingStart;
    this.pendingStart = null;
    this.gameStartingAt = null;
    this.gameStartTimer = null;
    let initialState = createInitialState(settings, spectrumPool);
    if (initialState.phase === "selection") {
      const { cluer, guesser } = rollRoles(initialState.playCounts);
      initialState = gameReducer(initialState, { type: "ROLL_ROLES", cluer, guesser });
    }
    this.game = {
      state: initialState,
      voiceMode,
      playerIdByIndex,
      readyForNext: /* @__PURE__ */ new Set(),
      pendingGuesses: /* @__PURE__ */ new Map(),
      clueTimeLimit: settings.clueTimeLimit ?? -1,
      guessTimeLimit: settings.guessTimeLimit ?? -1,
      deadlineAt: null,
      phaseTimer: null,
      prerolledCluer: null,
      prerolledGuesser: null
    };
    this.scheduleDeadlineForCurrentPhase();
    this.sendPrivateTargetToCluer();
    this.broadcastState();
  }
  // Sets up a deadline + timer that auto-advances the game when the cluer
  // (clue phase) or guessers (guess phase) sit on their hands. Cleared on
  // phase change. -1 / undefined = no deadline.
  scheduleDeadlineForCurrentPhase() {
    if (!this.game) return;
    if (this.game.phaseTimer) {
      clearTimeout(this.game.phaseTimer);
      this.game.phaseTimer = null;
    }
    this.game.deadlineAt = null;
    const phase = this.game.state.phase;
    const limit = phase === "clue" ? this.game.clueTimeLimit : phase === "guess" || phase === "pass" ? this.game.guessTimeLimit : -1;
    if (!limit || limit <= 0) return;
    this.game.deadlineAt = Date.now() + limit * 1e3;
    this.game.phaseTimer = setTimeout(() => {
      this.onPhaseExpired();
    }, limit * 1e3);
  }
  // Fired when a phase deadline runs out without the expected input.
  // - clue phase: force CLUE_SAID (voice) or empty text submit (text)
  // - guess phase: random guess for every player who hasn't submitted
  onPhaseExpired() {
    if (!this.game) return;
    const game = this.game;
    const phase = game.state.phase;
    if (phase === "clue") {
      if (!game.voiceMode && !game.clueText) {
        game.clueText = "(sem dica)";
      }
      game.state = gameReducer(game.state, { type: "SUBMIT_CLUE" });
      this.scheduleDeadlineForCurrentPhase();
      this.broadcastState();
      return;
    }
    if (phase === "guess" || phase === "pass") {
      const expected = game.state.guessQueue.slice();
      for (const idx of expected) {
        const id = game.playerIdByIndex[idx];
        if (!game.pendingGuesses.has(id)) {
          game.pendingGuesses.set(id, 90);
        }
      }
      for (const idx of expected) {
        const id = game.playerIdByIndex[idx];
        const ang = game.pendingGuesses.get(id) ?? 90;
        game.state = gameReducer(game.state, { type: "SUBMIT_GUESS", guessAngle: ang });
      }
      game.pendingGuesses.clear();
      this.scheduleDeadlineForCurrentPhase();
      this.broadcastState();
    }
  }
  // For all-guess mode in guess/pass phase, check whether all CONNECTED
  // expected guessers have submitted. If yes, flush the round through the
  // reducer (filling 90° defaults for anyone who's offline) and broadcast.
  // Returns true if it flushed, false otherwise.
  tryFlushAllGuesses() {
    const game = this.game;
    if (!game) return false;
    const s = game.state;
    if (s.phase !== "guess" && s.phase !== "pass") return false;
    const isAllGuess = s.gameMode === "individual" && s.roundFlow === "all-guess" && s.playerNames.length >= 3;
    if (!isAllGuess) return false;
    const expectedFromConnected = s.guessQueue.map((i) => game.playerIdByIndex[i]).filter((id) => !!id && (this.members.get(id)?.connected ?? false));
    const allIn = expectedFromConnected.every((id) => game.pendingGuesses.has(id));
    if (!allIn) return false;
    for (const i of s.guessQueue.slice()) {
      const id = game.playerIdByIndex[i];
      const guessAngle = game.pendingGuesses.get(id) ?? 90;
      game.state = gameReducer(game.state, { type: "SUBMIT_GUESS", guessAngle });
    }
    game.pendingGuesses.clear();
    this.scheduleDeadlineForCurrentPhase();
    this.broadcastState();
    return true;
  }
  handleSubmitClueText(conn, text) {
    const game = this.requireGame(conn);
    if (!game) return;
    if (game.voiceMode) {
      this.sendError(conn, "WRONG_PHASE", "Voice mode \u2014 use CLUE_SAID instead.");
      return;
    }
    if (game.state.phase !== "clue") {
      this.sendError(conn, "WRONG_PHASE", `Not in clue phase (current: ${game.state.phase}).`);
      return;
    }
    if (!this.isCallerCluer(conn)) {
      this.sendError(conn, "NOT_YOUR_TURN", "Only the cluer can submit the clue.");
      return;
    }
    const clean = (text ?? "").trim().slice(0, 80);
    if (!clean) {
      this.sendError(conn, "BAD_REQUEST", "Clue text is empty.");
      return;
    }
    game.clueText = clean;
    game.state = gameReducer(game.state, { type: "SUBMIT_CLUE" });
    this.scheduleDeadlineForCurrentPhase();
    this.broadcastState();
  }
  handleClueSaid(conn) {
    const game = this.requireGame(conn);
    if (!game) return;
    if (!game.voiceMode) {
      this.sendError(conn, "WRONG_PHASE", "Text mode \u2014 use SUBMIT_CLUE_TEXT.");
      return;
    }
    if (game.state.phase !== "clue") {
      this.sendError(conn, "WRONG_PHASE", `Not in clue phase (current: ${game.state.phase}).`);
      return;
    }
    if (!this.isCallerCluer(conn)) {
      this.sendError(conn, "NOT_YOUR_TURN", "Only the cluer can advance from clue.");
      return;
    }
    game.state = gameReducer(game.state, { type: "SUBMIT_CLUE" });
    this.scheduleDeadlineForCurrentPhase();
    this.broadcastState();
  }
  handleSubmitGuess(conn, angle) {
    const game = this.requireGame(conn);
    if (!game) return;
    if (game.state.phase !== "guess" && game.state.phase !== "pass") {
      this.sendError(conn, "WRONG_PHASE", `Not accepting guesses (phase: ${game.state.phase}).`);
      return;
    }
    if (typeof angle !== "number" || !Number.isFinite(angle)) {
      this.sendError(conn, "BAD_REQUEST", "Guess angle must be a number.");
      return;
    }
    const clamped = Math.max(0, Math.min(180, angle));
    const member = this.findMemberByConnection(conn.id);
    if (!member) {
      this.sendError(conn, "BAD_REQUEST", "Join first.");
      return;
    }
    const playerIdx = game.playerIdByIndex.indexOf(member.playerId);
    if (playerIdx < 0) {
      this.sendError(conn, "BAD_REQUEST", "Not a seated player.");
      return;
    }
    const isAllGuess = game.state.gameMode === "individual" && game.state.roundFlow === "all-guess" && game.state.playerNames.length >= 3;
    if (isAllGuess) {
      if (playerIdx === game.state.activeSideIndex) {
        this.sendError(conn, "NOT_YOUR_TURN", "Cluer doesn't guess.");
        return;
      }
      game.pendingGuesses.set(member.playerId, clamped);
      if (this.tryFlushAllGuesses()) return;
      this.broadcastState();
      return;
    }
    if (game.state.currentGuesserIndex !== playerIdx) {
      this.sendError(conn, "NOT_YOUR_TURN", "Not your turn to guess.");
      return;
    }
    game.state = gameReducer(game.state, { type: "SUBMIT_GUESS", guessAngle: clamped });
    this.scheduleDeadlineForCurrentPhase();
    this.broadcastState();
  }
  handleSkipCard(conn) {
    const game = this.requireGame(conn);
    if (!game) return;
    if (game.state.phase !== "clue") {
      this.sendError(conn, "WRONG_PHASE", "Can only skip during clue phase.");
      return;
    }
    if (!this.isCallerCluer(conn)) {
      this.sendError(conn, "NOT_YOUR_TURN", "Only the cluer can skip.");
      return;
    }
    const before = game.state.targetAngle;
    game.state = gameReducer(game.state, { type: "SKIP_ROUND" });
    if (game.state.targetAngle !== before) {
      this.sendPrivateTargetToCluer();
      this.scheduleDeadlineForCurrentPhase();
    }
    this.broadcastState();
  }
  handleReadyNextRound(conn) {
    const game = this.requireGame(conn);
    if (!game) return;
    if (game.state.phase !== "result") {
      this.sendError(conn, "WRONG_PHASE", "Can only advance from result phase.");
      return;
    }
    const member = this.findMemberByConnection(conn.id);
    if (!member) return;
    const nextCluerId = this.computeNextCluerId();
    if (nextCluerId) {
      if (member.playerId !== nextCluerId) {
        return;
      }
    } else {
      game.readyForNext.add(member.playerId);
      const seatedConnected = game.playerIdByIndex.filter((id) => {
        const m = this.members.get(id);
        return m?.connected;
      });
      const allReady = seatedConnected.every((id) => game.readyForNext.has(id));
      if (!allReady) {
        this.broadcastState();
        return;
      }
    }
    game.readyForNext.clear();
    game.clueText = void 0;
    const preCluer = game.prerolledCluer;
    const preGuesser = game.prerolledGuesser;
    game.state = gameReducer(game.state, { type: "NEXT_ROUND" });
    if (game.state.phase === "selection") {
      const cluer = preCluer ?? rollRoles(game.state.playCounts).cluer;
      const guesser = preGuesser ?? rollRoles(game.state.playCounts).guesser;
      game.state = gameReducer(game.state, { type: "ROLL_ROLES", cluer, guesser });
    }
    game.prerolledCluer = null;
    game.prerolledGuesser = null;
    this.sendPrivateTargetToCluer();
    this.scheduleDeadlineForCurrentPhase();
    this.broadcastState();
  }
  // ---------- Helpers ----------
  requireGame(conn) {
    if (!this.game) {
      this.sendError(conn, "NOT_IN_GAME", "No game in progress.");
      return null;
    }
    return this.game;
  }
  findMemberByConnection(connectionId) {
    for (const m of this.members.values()) {
      if (m.connectionId === connectionId) return m;
    }
    return void 0;
  }
  isCluer(playerId) {
    if (!this.game) return false;
    return this.game.playerIdByIndex[this.game.state.activeSideIndex] === playerId;
  }
  isCallerCluer(conn) {
    const member = this.findMemberByConnection(conn.id);
    return !!member && this.isCluer(member.playerId);
  }
  sendPrivateTargetToCluer() {
    if (!this.game) return;
    const cluerId = this.game.playerIdByIndex[this.game.state.activeSideIndex];
    const cluerMember = this.members.get(cluerId);
    if (!cluerMember) return;
    for (const conn of this.getConnections()) {
      if (conn.id === cluerMember.connectionId) {
        conn.send(
          this.encodeServerMessage({
            type: "PRIVATE_TARGET",
            angle: this.game.state.targetAngle
          })
        );
        return;
      }
    }
  }
  buildPublicRoundState() {
    if (!this.game) return void 0;
    const s = this.game.state;
    const cluerId = this.game.playerIdByIndex[s.activeSideIndex] ?? "";
    const submittedFromPending = [...this.game.pendingGuesses.keys()];
    const submittedFromReducer = s.roundGuesses.map((g) => this.game.playerIdByIndex[g.playerIndex]).filter((id) => !!id);
    const submittedGuessIds = Array.from(
      /* @__PURE__ */ new Set([...submittedFromPending, ...submittedFromReducer])
    );
    const expectedGuessIds = s.phase === "guess" || s.phase === "pass" ? s.guessQueue.map((i) => this.game.playerIdByIndex[i]).filter((id) => !!id && !this.game.pendingGuesses.has(id)) : [];
    const revealed = s.phase === "result" || s.phase === "gameover";
    const guesses = revealed ? s.roundGuesses.map((g) => ({
      playerId: this.game.playerIdByIndex[g.playerIndex] ?? "",
      angle: g.angle,
      score: g.score
    })) : void 0;
    const lastRecord = revealed ? s.roundHistory[s.roundHistory.length - 1] : void 0;
    const cluerSkipsRemaining = s.phase === "clue" ? s.skipsRemaining[s.activeSideIndex] ?? 0 : void 0;
    return {
      cluerId,
      spectrum: s.currentSpectrum,
      clueText: this.game.clueText,
      clueSubmitted: s.phase !== "clue" && s.phase !== "selection",
      submittedGuessIds,
      expectedGuessIds,
      guesses,
      targetAngle: revealed ? s.targetAngle : void 0,
      cluerBonus: lastRecord?.cluerBonus,
      cluerSkipsRemaining,
      deadlineAt: this.game.deadlineAt ?? void 0
    };
  }
  // Lock in who the next cluer will be the moment we enter result phase, so
  // the result UI can address them specifically. For single-guess + N>=3 the
  // reducer normally rolls roles via ROLL_ROLES inside the selection phase
  // *after* NEXT_ROUND; we pre-roll here using the same `rollRoles` helper so
  // clients can show "{name} é o próximo a dar a dica" right away. The
  // pre-rolled pair is consumed when handleReadyNextRound fires NEXT_ROUND.
  prerollNextRoundIfNeeded() {
    if (!this.game) return;
    const s = this.game.state;
    if (s.phase !== "result") {
      this.game.prerolledCluer = null;
      this.game.prerolledGuesser = null;
      return;
    }
    if (this.game.prerolledCluer != null) return;
    const n = s.playerNames.length;
    if (s.gameMode === "teams" || s.roundFlow !== "single-guess" || n < 3) {
      return;
    }
    const { cluer, guesser } = rollRoles(s.playCounts);
    this.game.prerolledCluer = cluer;
    this.game.prerolledGuesser = guesser;
  }
  // Who will be the cluer in the next round? Only meaningful in `result`
  // phase. Uses deterministic rotation (2 players, all-guess N>=3) or the
  // pre-rolled roles (single-guess N>=3).
  computeNextCluerId() {
    if (!this.game || this.game.state.phase !== "result") return void 0;
    const s = this.game.state;
    const n = s.playerNames.length;
    if (s.gameMode === "teams") return void 0;
    if (n === 2) {
      const next = s.activeSideIndex === 0 ? 1 : 0;
      return this.game.playerIdByIndex[next];
    }
    if (s.roundFlow === "all-guess") {
      const next = (s.activeSideIndex + 1) % n;
      return this.game.playerIdByIndex[next];
    }
    if (this.game.prerolledCluer != null) {
      return this.game.playerIdByIndex[this.game.prerolledCluer];
    }
    return void 0;
  }
  computeWinnerId() {
    if (!this.game || this.game.state.phase !== "gameover") return void 0;
    const s = this.game.state;
    const n = s.playerNames.length;
    const diffs = computeAvgDiffs(s.roundHistory, n);
    let bestIdx = -1;
    let bestScore = -1;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < n; i++) {
      const score = s.scores[i] ?? 0;
      const d = diffs[i] ?? Number.POSITIVE_INFINITY;
      if (score > bestScore || score === bestScore && d < bestDiff) {
        bestScore = score;
        bestDiff = d;
        bestIdx = i;
      }
    }
    return bestIdx >= 0 ? this.game.playerIdByIndex[bestIdx] : void 0;
  }
  publicState() {
    this.prerollNextRoundIfNeeded();
    const players = [];
    for (const m of this.members.values()) {
      const idx = this.game?.playerIdByIndex.indexOf(m.playerId) ?? -1;
      const score = idx >= 0 ? this.game.state.scores[idx] ?? 0 : 0;
      players.push({
        id: m.playerId,
        name: m.name,
        color: m.color,
        connected: m.connected,
        isHost: m.isHost,
        isReady: m.isReady,
        score
      });
    }
    let phase = "lobby";
    if (this.game) {
      const p = this.game.state.phase;
      phase = p === "pass" ? "guess" : p === "selection" ? "clue" : p;
    }
    return {
      code: this.name.toUpperCase(),
      hostId: this.hostPlayerId ?? "",
      phase,
      voiceMode: this.game?.voiceMode ?? false,
      players,
      config: void 0,
      round: this.buildPublicRoundState(),
      roundNumber: this.game?.state.round ?? 0,
      history: this.game?.state.roundHistory ?? [],
      winnerId: this.computeWinnerId(),
      gameStartingAt: this.gameStartingAt ?? void 0,
      nextCluerId: this.computeNextCluerId(),
      roomConfig: this.roomConfig ?? void 0
    };
  }
  broadcastState() {
    this.broadcast(
      this.encodeServerMessage({ type: "STATE", state: this.publicState() })
    );
  }
  sendError(conn, code, message) {
    conn.send(this.encodeServerMessage({ type: "ERROR", code, message }));
  }
  encodeServerMessage(msg) {
    return JSON.stringify(msg);
  }
};

// src/index.ts
var src_default = {
  async fetch(request, env2) {
    return await routePartykitRequest(request, env2) ?? new Response("Not found", { status: 404 });
  }
};

// ../../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-sQVAyD/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-sQVAyD/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  SintoniaRoom,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
