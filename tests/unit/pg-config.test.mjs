import { test } from "node:test";
import assert from "node:assert/strict";
import { poolConfig } from "../../scripts/lib/pg-config.mjs";

test("local PostgreSQL uses plain TCP", () => {
  for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
    assert.equal(poolConfig(`postgresql://u:p@${host}:5432/db`).ssl, false, host);
  }
});

test("hosted PostgreSQL such as Supabase uses TLS", () => {
  const cfg = poolConfig("postgresql://postgres.abc:pw@aws-0-eu.pooler.supabase.com:6543/postgres");
  assert.deepEqual(cfg.ssl, { rejectUnauthorized: false });
});

test("invalid URI is rejected", () => {
  assert.throws(() => poolConfig("not a url"), /not a valid/);
});
