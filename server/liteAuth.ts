import sha1 from "sha1";

function getSalt(): string {
  if (!process.env.SALT) {
    process.env.SALT = sha1("" + Math.random() + Date.now());
  }
  return process.env.SALT;
}

export function checkToken(token: string) {
  const salt = getSalt();
  try {
    const t = Buffer.from(token, "base64").toString("utf-8");
    const u = t.split(".")[0];
    const s = t.split(".")[1];
    if (sha1(u + salt) == s) return true;
    return false;
  } catch (e: any) {
    console.error(e);
    return false;
  }
}

export function getToken(user: string) {
  const salt = getSalt();
  const s = sha1(user + salt);
  const t = Buffer.from(user + "." + s, "utf-8").toString("base64");
  return t;
}
