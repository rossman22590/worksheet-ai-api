import express from "express"
const app = express()

import dotenv from "dotenv"
dotenv.config()

import { OpenAIApi, Configuration } from "openai"
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
  console.time()
  const userSecret = req.query.secret
  if (userSecret != process.env.SECRET) {
    res.json("Unauthorized Request")
  } else {
    const prompt = req.query.prompt
    const num = req.query.num
    let parsedNum = 0
    if (prompt) {
      if (num) {
        parsedNum = parseInt(num.toString())
      } else {
        parsedNum = 3
      }
      const stringifiedPrompt = prompt.toString()
      const response = await getMcTest(stringifiedPrompt, parsedNum)
      console.timeEnd()
      res.json(response)
    }
  }
})

app.listen(process.env.PORT, () => {
  console.log(`app running on http://localhost:${process.env.PORT}`)
})

const getMcTest = async (subject: string, num: number): Promise<string> => {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: "create a practice " + subject  + " multiple choice test with " + num +" questions in a JSON format",
    max_tokens: 2020,
    temperature: 0.1,
  });

  const output = response.data.choices[0].text
  console.log(output)

  if (output) {
    return output
  } else {
    return "Failed request"
  } 
}