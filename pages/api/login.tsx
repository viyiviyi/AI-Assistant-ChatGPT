import { getToken } from "@/server/liteAuth";
import { existsSync, fstat, readFileSync } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

const userFile = path.resolve(process.cwd(), "users.json");
let users: { user: string; pass: string }[] = [];
if (!existsSync(userFile)) {
  console.log("无用户配置文件");
} else {
  try {
    users = JSON.parse(readFileSync(userFile).toString());
  } catch (error) {
    console.error("读取用户文件出错", error);
  }
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ result?: string; error?: { message: string } }>
) {
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
