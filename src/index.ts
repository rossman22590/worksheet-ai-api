import express from "express"
const app = express()
import bodyParser from "body-parser"

import dotenv from "dotenv"
dotenv.config()

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

import { createClient } from "@supabase/supabase-js";
// @ts-expect-error
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY)
import { decode } from "base64-arraybuffer"; 

import { uid } from "uid"

import { TextServiceClient } from "@google-ai/generativelanguage"
import { GoogleAuth } from "google-auth-library"
const MODEL_NAME = "models/text-bison-001";
const PALM_API_KEY: string = process.env.PALM_API_KEY || "key";
const client = new TextServiceClient({
  authClient: new GoogleAuth().fromAPIKey(PALM_API_KEY),
});

import cors from "cors"
import { TDocumentDefinitions } from "pdfmake/interfaces";

import { WorkSheetRes } from "./types";
import { ReqBody } from "./types";

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get("/", (req, res) => {
  const userSecret = req.query.secret
  if (!userSecret || userSecret != process.env.SECRET) {
    res.json("Unauthorized")
  } else {
    res.json("Authorized")
  }
})

app.post("/worksheet", async (req, res) => {
  const userSecret = req.query.secret
  if (userSecret != process.env.SECRET) {
    res.json("Unauthorized Request")
  } else {
    console.log(req.body)
    const response = await getWorksheet(req.body)
    res.json(response)
  }
})

app.listen(process.env.PORT, () => {
  console.log(`app running on http://localhost:${process.env.PORT}`)
})

const getWorksheet = async ({ subject, topic, title, num }: ReqBody): Promise<WorkSheetRes | string> => {
  console.log(subject, topic, title, num)
  const prompt = `Create a(n) ${subject} ${topic} worksheet with ${num} questions. Do not put the answers below the question and only list the correct answers at the bottom and add space after each question.`
  const result = await client.generateText({
    model: MODEL_NAME,
    temperature: 0,
    prompt: {
      text: prompt,
    },
  })
  if (result && result[0].candidates) {
    const worksheetString = result[0].candidates[0].output
    const worksheetStringArr = worksheetString?.split("Answers")
    if (worksheetStringArr) {

      const docDef: TDocumentDefinitions = {
        content: [
          "\n",
          { text: title, style: 'header'},
          "\n",
          worksheetStringArr[0],
          { text: worksheetStringArr[1], pageBreak: 'before'},
        ],

        styles: {
          header: {
            fontSize: 22,
            bold: true
          }
        }
      }

      const pathToFile = `worksheets/${uid()}`
      const pdfGenerator = pdfMake.createPdf(docDef)
      pdfGenerator.getBase64(async (base64) => {
        const { data, error } = await supabase.storage.from('pdfs').upload(pathToFile, decode(base64), 
        {
          contentType: 'application/pdf'
        })
        if (error) {
          console.log(error)
        }
      })

      const { data } = supabase.storage.from("pdfs").getPublicUrl(pathToFile)

      return {
        data: worksheetString || "",
        urlToPdf: data.publicUrl
      }
    } else {
      return "Failed Request"
    }
  } else {
    return "Failed Request"
  }
}

