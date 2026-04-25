const baseUrl = process.env.LOGARYS_CONSOLE_URL ?? "http://localhost:3000";

export async function get(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  return parseResponse(response);
}

export async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseResponse(response);
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

export function assertOk(response) {
  if (!response.ok) {
    throw new Error(
      `Expected HTTP 2xx but got ${response.status}: ${JSON.stringify(response.body, null, 2)}`,
    );
  }
}
