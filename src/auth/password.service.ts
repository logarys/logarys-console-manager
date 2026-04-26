import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

export class PasswordService {
  static async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("base64url");
    const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

    return `${HASH_PREFIX}$${salt}$${derivedKey.toString("base64url")}`;
  }

  static async verify(password: string, storedHash: string): Promise<boolean> {
    const [prefix, salt, hash] = storedHash.split("$");

    if (prefix !== HASH_PREFIX || !salt || !hash) {
      return false;
    }

    const expected = Buffer.from(hash, "base64url");
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;

    if (actual.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(actual, expected);
  }
}
