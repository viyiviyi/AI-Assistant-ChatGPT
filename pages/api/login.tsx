import { getToken } from "@/server/liteAuth";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ result?: string; error?: { message: string } }>
) {
  const users: { user: string; pass: string }[] = require("../../users.json");
  let { user, pass } = req.body;
  const u = users.find((f) => f.user === user);
  if (!u || !user) {
    res.status(200).json({ error: { message: "登录失败，用户名不存在" } });
    return;
  }
  if (u.pass != pass || !pass) {
    res.status(200).json({ error: { message: "登录失败，密码错误" } });
    return;
  }
  res.status(200).json({ result: getToken(user) });
}
