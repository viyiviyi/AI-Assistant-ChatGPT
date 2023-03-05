import { checkToken } from "@/server/liteAuth";
import { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ result?: string; error?: { message: string } }>
) {
  const token: string = req.body.token || "";
  if (!checkToken(token)) {
    res.status(401).json({ error: { message: "未登录 [去登录](/login)" } });
    return;
  }
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured",
//         message: `
// 可以使用OpenAI的Python库来调用OpenAI的API接口。

// 安装：

// pip install openai

// 使用：
// ${"```python"}
// import openai

// openai.api_key = "YOUR_API_KEY"

// # Create an environment
// env = openai.Env(environment_id="YOUR_ENVIRONMENT_ID")

// # Reset the environment
// env.reset()

// # Get the observation
// observation = env.observation_space

// # Take an action
// action = env.action_space.sample()
// env.step(action)

// # Get the reward
// reward = env.reward_space
// ${"```"}`,
      },
    });
    return;
  }
  const message: string = req.body.message || "";
  const model: string = req.body.model || "text-davinci-003";
  const temperature: number = req.body.temperature || 0.5;
  const user: string = req.body.user || "user";
  const top_p: number = req.body.top_p || 1;
  if (message.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid message",
      },
    });
    return;
  }

  try {
    if (model.startsWith("gpt-3")) {
      const completion = await openai.createChatCompletion({
        model,
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        temperature,
        user,
        max_tokens: 1000,
        top_p,
      });
      res
        .status(200)
        .json({ result: completion.data.choices[0].message?.content });
    } else {
      const completion = await openai.createCompletion({
        model,
        prompt: message,
        temperature,
        user,
        max_tokens: 1000,
        top_p,
      });
      res.status(200).json({ result: completion.data.choices[0].text });
    }
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: `Error with OpenAI API request: ${error.message}`,
        },
      });
    }
  }
}
