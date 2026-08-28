import { decryptSecret, encryptSecret, last4 } from "./cryptoSecrets";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

export function demoCryptoSecrets() {
  const prev = process.env.APP_ENCRYPTION_KEY;
  process.env.APP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  try {
    const plain = "sk-test-secret-key-value";
    const enc = encryptSecret(plain);
    assert(enc !== plain, "ciphertext differs");
    assert(decryptSecret(enc) === plain, "round-trip");
    assert(last4(plain) === "alue", "last4");
    console.log("cryptoSecrets demo: ok");
  } finally {
    if (prev === undefined) delete process.env.APP_ENCRYPTION_KEY;
    else process.env.APP_ENCRYPTION_KEY = prev;
  }
}

if (typeof require !== "undefined" && require.main === module) {
  demoCryptoSecrets();
}
