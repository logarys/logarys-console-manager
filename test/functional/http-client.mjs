const baseUrl = process.env.LOGARYS_CONSOLE_URL ?? "http://localhost:3000";

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@logarys.local";
const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-password";

let adminTokenPromise = null;
const regularTokenPromises = new Map();

export async function get(path, options = {}) {
  return request("GET", path, undefined, options);
}

export async function post(path, body, options = {}) {
  return request("POST", path, body, options);
}

export async function put(path, body, options = {}) {
  return request("PUT", path, body, options);
}

export async function patch(path, body, options = {}) {
  return request("PATCH", path, body, options);
}

export async function del(path, options = {}) {
  return request("DELETE", path, undefined, options);
}

export async function request(method, path, body, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    ...(options.headers ?? {}),
  };

  const token = await resolveToken(options.auth ?? "admin");

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  return parseResponse(response);
}

export async function login(email, password) {
  return post("/auth/login", { email, password }, { auth: false });
}

export async function getAdminToken() {
  if (!adminTokenPromise) {
    adminTokenPromise = loginWithRetry(adminEmail, adminPassword).then((response) => {
      assertLoginOk(response, adminEmail);
      return response.body.accessToken;
    });
  }

  return adminTokenPromise;
}

export async function createRegularUser(prefix = "functional-user") {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const password = `password-${suffix}`;
  const payload = {
    name: `${prefix}-${suffix}`,
    email: `${prefix}-${suffix}@example.com`,
    password,
    isAdmin: false,
    isEnabled: true,
  };

  const response = await post("/users", payload);
  assertOk(response);

  return {
    ...response.body,
    password,
  };
}

export async function getRegularToken(user = null) {
  const regularUser = user ?? await createRegularUser();
  const key = regularUser.email;

  if (!regularTokenPromises.has(key)) {
    regularTokenPromises.set(
      key,
      login(regularUser.email, regularUser.password).then((response) => {
        assertLoginOk(response, regularUser.email);
        return response.body.accessToken;
      }),
    );
  }

  return regularTokenPromises.get(key);
}

async function resolveToken(auth) {
  if (auth === false || auth === null || auth === "none") {
    return null;
  }

  if (typeof auth === "string" && auth !== "admin" && auth !== "regular") {
    return auth;
  }

  if (auth && typeof auth === "object" && auth.token) {
    return auth.token;
  }

  if (auth === "regular") {
    return getRegularToken();
  }

  return getAdminToken();
}

async function loginWithRetry(email, password, attempts = 30) {
  let lastResponse = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await login(email, password);

      if (response.ok) {
        return response;
      }

      lastResponse = response;
    } catch (error) {
      lastResponse = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (lastResponse instanceof Error) {
    throw lastResponse;
  }

  return lastResponse;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") ?? "";

  let body = null;

  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return {
    status: response.status,
    ok: response.ok,
    body,
  };
}

function assertLoginOk(response, email) {
  if (!response.ok || !response.body?.accessToken) {
    throw new Error(
      `Unable to login functional test user ${email}: ${JSON.stringify(response.body, null, 2)}`,
    );
  }
}

export function assertOk(response) {
  if (!response.ok) {
    throw new Error(
      `Expected HTTP 2xx but got ${response.status}: ${JSON.stringify(response.body, null, 2)}`,
    );
  }
}
