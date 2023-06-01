import express from "express"
const app = express()

import dotenv from "dotenv"
dotenv.config()

import { OpenAIApi, Configuration, ChatCompletionResponseMessage } from "openai"
const config = new Configuration({
  apiKey: process.env.OPEN_AI_API_KEY
})
const openai = new OpenAIApi(config)

import cors from "cors"

app.use(cors())

app.get("/", (req, res) => {
  const userSecret = req.query.secret
  if (!userSecret || userSecret != process.env.SECRET) {
    res.json("Unauthorized")
  } else {
    res.json("Authorized")
  }
})

app.get("/mc", async (req, res) => {
  const userSecret = req.query.secret
  if (userSecret != process.env.SECRET) {
    res.json("Unauthorized Request")
  } else {
    const prompt = req.query.prompt
    if (prompt) {
      const stringifiedPrompt = prompt.toString()
      const response = await getMcTest(stringifiedPrompt)
      res.json(response)
    }
  }
})

app.listen(process.env.PORT, () => {
  console.log(`app running on http://localhost:${process.env.PORT}`)
})

const getMcTest = async (prompt: string): Promise<string> => {
  const systemMessage = `You are a multiple choice test generation AI. The user will give you a prompt and your task is to output a task in a JSON format based on that prompt.  Make the questions different from each other while adhering to the prompt. The json you will output will be an object "output" which is an array of  length 10 of question objects. Question objects have a property "answers" which is a string array of the answer choices, a property "title" which is the actual question and a property "rightAnswer" which is the actual answer.`
  const fullPrompt = `${systemMessage} prompt: ${prompt}`

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: fullPrompt,
    max_tokens: 3500,
    temperature: 0.7,
  });

  const output = response.data.choices[0].text

  if (output) {
    return output
  } else {
    return "Failed request"
  } 
}