import { MongoClient } from "mongodb";
import { randomBytes, randomUUID, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const mongoUrl = process.env.MONGODB_URI ?? process.env.MONGO_URL ?? "mongodb://localhost:27017";
const mongoDb = process.env.MONGODB_DATABASE ?? process.env.MONGO_DB ?? "logarys";

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function showHelp() {
  console.log(`
Usage:
  npm run user:create -- --name "Admin" --email admin@example.com --password "secret" [--admin] [--disabled]
  npm run user:password -- --email admin@example.com --password "new-secret"
`);
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString("base64url")}`;
}

function assertPassword(password) {
  if (password.length < 8) throw new Error("Password must contain at least 8 characters");
}

async function connect() {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  const users = client.db(mongoDb).collection("users");
  await users.createIndex({ id: 1 }, { unique: true });
  await users.createIndex({ email: 1 }, { unique: true });
  return { client, users };
}

async function createUser() {
  const name = getArg("--name")?.trim();
  const email = getArg("--email")?.toLowerCase().trim();
  const password = getArg("--password");
  const isAdmin = hasFlag("--admin");
  const isEnabled = !hasFlag("--disabled");

  if (!name || !email || !password) {
    showHelp();
    process.exit(1);
  }

  assertPassword(password);
  const { client, users } = await connect();

  try {
    if (await users.findOne({ email })) throw new Error(`User already exists: ${email}`);
    const now = new Date();
    await users.insertOne({
      id: randomUUID(),
      name,
      email,
      password: await hashPassword(password),
      isAdmin,
      isEnabled,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`User created: ${email}`);
  } finally {
    await client.close();
  }
}

async function updatePassword() {
  const email = getArg("--email")?.toLowerCase().trim();
  const password = getArg("--password");

  if (!email || !password) {
    showHelp();
    process.exit(1);
  }

  assertPassword(password);
  const { client, users } = await connect();

  try {
    const result = await users.updateOne({ email }, { $set: { password: await hashPassword(password), updatedAt: new Date() } });
    if (result.matchedCount === 0) throw new Error(`User not found: ${email}`);
    console.log(`Password updated for: ${email}`);
  } finally {
    await client.close();
  }
}

const command = process.argv[2];
if (command === "create") await createUser();
else if (command === "password") await updatePassword();
else {
  showHelp();
  process.exit(1);
}
