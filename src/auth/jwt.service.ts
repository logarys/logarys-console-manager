import { createHmac, timingSafeEqual } from "node:crypto";

export interface JwtUserPayload {
  sub: string;
  email: string;
  isAdmin: boolean;
  exp?: number;
  iat?: number;
}

function base64UrlEncode(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlJson(value: unknown): string {
  return base64UrlEncode(JSON.stringify(value));
}

function signPart(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export class JwtService {
  private readonly secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
  private readonly expiresInSeconds = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 43200);

  sign(payload: Omit<JwtUserPayload, "exp" | "iat">): string {
    const now = Math.floor(Date.now() / 1000);
    const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
    const body = base64UrlJson({
      ...payload,
      iat: now,
      exp: now + this.expiresInSeconds,
    });
    const unsignedToken = `${header}.${body}`;
    const signature = signPart(unsignedToken, this.secret);

    return `${unsignedToken}.${signature}`;
  }

  verify(token: string): JwtUserPayload {
    const [header, body, signature] = token.split(".");

    if (!header || !body || !signature) {
      throw new Error("Invalid token format");
    }

    const unsignedToken = `${header}.${body}`;
    const expectedSignature = signPart(unsignedToken, this.secret);
    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new Error("Invalid token signature");
    }

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as JwtUserPayload;

    if (!payload.sub || !payload.email || typeof payload.isAdmin !== "boolean") {
      throw new Error("Invalid token payload");
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Expired token");
    }

    return payload;
  }
}
