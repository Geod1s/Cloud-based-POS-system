// Very simple PIN hashing using WebCrypto; you can replace with a stronger KDF.
async function sha256Hex(input: string) {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Called after ONLINE login succeeds the first time
export async function provisionOfflineUser(db: any, user: { id: string; email: string }, profile: { role: string; full_name: string | null }, pin: string) {
  const deviceId = crypto.randomUUID();
  const pinHash = await sha256Hex(`${user.id}:${pin}`);
  const now = new Date().toISOString();

  await db.execute(
    `INSERT OR REPLACE INTO local_profile (user_id, email, role, full_name, device_id, offline_pin_hash, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user.id, user.email, profile.role, profile.full_name ?? null, deviceId, pinHash, now]
  );
}

// On offline launch: verify user-provided PIN against stored hash
export async function unlockOffline(db: any, emailOrUserId: string, pin: string) {
  // Lookup by email (preferred) or user_id
  const rows = await db.select(`SELECT * FROM local_profile WHERE email = ? OR user_id = ? LIMIT 1`, [emailOrUserId, emailOrUserId]);
  const row = rows?.[0];
  if (!row) throw new Error("This device is not provisioned for offline use yet.");

  const pinHash = await sha256Hex(`${row.user_id}:${pin}`);
  if (pinHash !== row.offline_pin_hash) throw new Error("Invalid PIN.");

  return {
    user: { id: row.user_id, email: row.email },
    profile: { role: row.role, full_name: row.full_name },
    deviceId: row.device_id,
    mode: "offline" as const,
  };
}
