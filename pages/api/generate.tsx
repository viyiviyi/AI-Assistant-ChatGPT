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
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured",
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
  } catch (error) {
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
