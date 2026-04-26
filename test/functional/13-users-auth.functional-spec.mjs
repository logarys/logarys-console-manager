import test from "node:test";
import assert from "node:assert/strict";
import {
  del,
  get,
  post,
  patch,
  login,
  assertOk,
  createRegularUser,
  getRegularToken,
} from "./http-client.mjs";

function uniqueUserPayload(prefix = "functional-auth-user") {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    name: `${prefix}-${suffix}`,
    email: `${prefix}-${suffix}@example.com`,
    password: `password-${suffix}`,
    isAdmin: false,
    isEnabled: true,
  };
}

function assertSafeUser(user) {
  assert.equal(typeof user.id, "string");
  assert.equal(typeof user.name, "string");
  assert.equal(typeof user.email, "string");
  assert.equal(typeof user.isAdmin, "boolean");
  assert.equal(typeof user.isEnabled, "boolean");
  assert.equal(user.password, undefined);
}

test("protected routes should reject requests without bearer token", async () => {
  const response = await get("/users/me", { auth: false });

  assert.equal(response.status, 401, JSON.stringify(response.body));
  assert.match(JSON.stringify(response.body), /bearer token|Unauthorized/i);
});

test("POST /auth/login should return a token and safe user", async () => {
  const user = await createRegularUser("functional-login-user");
  const response = await login(user.email, user.password);

  assertOk(response);
  assert.equal(typeof response.body.accessToken, "string");
  assertSafeUser(response.body.user);
  assert.equal(response.body.user.email, user.email);
  assert.equal(response.body.user.password, undefined);
});

test("POST /auth/login should reject invalid credentials", async () => {
  const user = await createRegularUser("functional-invalid-login-user");
  const response = await login(user.email, "wrong-password");

  assert.equal(response.status, 401, JSON.stringify(response.body));
});

test("admin should create, list, update, disable and delete users", async () => {
  const payload = uniqueUserPayload("functional-crud-user");

  const created = await post("/users", payload);
  assertOk(created);
  assertSafeUser(created.body);
  assert.equal(created.body.name, payload.name);
  assert.equal(created.body.email, payload.email);
  assert.equal(created.body.isAdmin, false);
  assert.equal(created.body.isEnabled, true);

  const listed = await get("/users");
  assertOk(listed);
  assert.equal(Array.isArray(listed.body), true);
  assert.ok(
    listed.body.some((user) => user.id === created.body.id),
    `Expected ${created.body.email} to be present in /users`,
  );

  const updated = await patch(`/users/${created.body.id}`, {
    name: `${payload.name} updated`,
    isAdmin: true,
  });
  assertOk(updated);
  assert.equal(updated.body.name, `${payload.name} updated`);
  assert.equal(updated.body.isAdmin, true);

  const disabled = await patch(`/users/${created.body.id}/disable`, {});
  assertOk(disabled);
  assert.equal(disabled.body.isEnabled, false);

  const deleted = await del(`/users/${created.body.id}`);
  assertOk(deleted);
  assert.equal(deleted.body.deleted, true);
});

test("regular user should not access admin user routes", async () => {
  const user = await createRegularUser("functional-regular-denied-user");
  const token = await getRegularToken(user);

  const listResponse = await get("/users", { auth: token });
  assert.equal(listResponse.status, 403, JSON.stringify(listResponse.body));

  const createResponse = await post("/users", uniqueUserPayload(), { auth: token });
  assert.equal(createResponse.status, 403, JSON.stringify(createResponse.body));

  const updateResponse = await patch(`/users/${user.id}`, { isAdmin: true }, { auth: token });
  assert.equal(updateResponse.status, 403, JSON.stringify(updateResponse.body));
});

test("regular user should read and update only own profile fields", async () => {
  const user = await createRegularUser("functional-profile-user");
  const token = await getRegularToken(user);

  const me = await get("/users/me", { auth: token });
  assertOk(me);
  assertSafeUser(me.body);
  assert.equal(me.body.id, user.id);
  assert.equal(me.body.email, user.email);
  assert.equal(me.body.isAdmin, false);
  assert.equal(me.body.isEnabled, true);

  const newEmail = `updated-${user.email}`;
  const updated = await patch(
    "/users/me",
    {
      name: "Updated profile user",
      email: newEmail,
      password: "new-profile-password",
      isAdmin: true,
      isEnabled: false,
    },
    { auth: token },
  );

  assertOk(updated);
  assert.equal(updated.body.name, "Updated profile user");
  assert.equal(updated.body.email, newEmail);
  assert.equal(updated.body.isAdmin, false);
  assert.equal(updated.body.isEnabled, true);

  const oldLogin = await login(user.email, user.password);
  assert.equal(oldLogin.status, 401, JSON.stringify(oldLogin.body));

  const newLogin = await login(newEmail, "new-profile-password");
  assertOk(newLogin);
  assert.equal(newLogin.body.user.email, newEmail);
});

test("disabled user should not login", async () => {
  const payload = uniqueUserPayload("functional-disabled-login-user");
  const created = await post("/users", payload);
  assertOk(created);

  const disabled = await patch(`/users/${created.body.id}/disable`, {});
  assertOk(disabled);

  const response = await login(payload.email, payload.password);
  assert.equal(response.status, 401, JSON.stringify(response.body));
});
