"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pdfmake_1 = __importDefault(require("pdfmake/build/pdfmake"));
const vfs_fonts_1 = __importDefault(require("pdfmake/build/vfs_fonts"));
pdfmake_1.default.vfs = vfs_fonts_1.default.pdfMake.vfs;
const supabase_js_1 = require("@supabase/supabase-js");
// @ts-expect-error
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);
const base64_arraybuffer_1 = require("base64-arraybuffer");
const uid_1 = require("uid");
const generativelanguage_1 = require("@google-ai/generativelanguage");
const google_auth_library_1 = require("google-auth-library");
const MODEL_NAME = "models/text-bison-001";
const PALM_API_KEY = process.env.PALM_API_KEY || "key";
const client = new generativelanguage_1.TextServiceClient({
    authClient: new google_auth_library_1.GoogleAuth().fromAPIKey(PALM_API_KEY),
});
const cors_1 = __importDefault(require("cors"));
app.use((0, cors_1.default)());
app.get("/", (req, res) => {
    const userSecret = req.query.secret;
    if (!userSecret || userSecret != process.env.SECRET) {
        res.json("Unauthorized");
    }
    else {
        res.json("Authorized");
    }
});
app.get("/worksheet", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userSecret = req.query.secret;
    if (userSecret != process.env.SECRET) {
        res.json("Unauthorized Request");
    }
    else {
        const subject = req.query.subject;
        const topic = req.query.topic;
        const num = req.query.num;
        const title = req.query.title;
        let parsedNum = 0;
        if (subject && topic && title) {
            if (num) {
                parsedNum = parseInt(num.toString());
            }
            else {
                parsedNum = 3;
            }
            const stringifiedSubject = subject.toString();
            const stringifiedTopic = topic.toString();
            const stringifiedTitle = title.toString();
            const response = yield getWorksheet(stringifiedSubject, stringifiedTopic, stringifiedTitle, parsedNum);
            res.json(response);
        }
    }
}));
app.listen(process.env.PORT, () => {
    console.log(`app running on http://localhost:${process.env.PORT}`);
});
const getWorksheet = (subject, topic, title, num) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = `Create a(n) ${subject} ${topic} worksheet with ${num} questions. Do not put the answers below the question and only list the correct answers at the bottom and add space after each question.`;
    const result = yield client.generateText({
        model: MODEL_NAME,
        temperature: 0,
        prompt: {
            text: prompt,
        },
    });
    if (result && result[0].candidates) {
        const worksheetString = result[0].candidates[0].output;
        const data = JSON.stringify(result);
        const worksheetStringArr = worksheetString === null || worksheetString === void 0 ? void 0 : worksheetString.split("Answers");
        if (worksheetStringArr) {
            const docDef = {
                content: [
                    "\n",
                    { text: title, style: 'header' },
                    "\n",
                    worksheetStringArr[0],
                    worksheetStringArr[1]
                ],
                styles: {
                    header: {
                        fontSize: 22,
                        bold: true
                    }
                }
            };
            const pathToFile = `worksheeets/${(0, uid_1.uid)()}`;
            const pdfGenerator = pdfmake_1.default.createPdf(docDef);
            pdfGenerator.getBase64((base64) => __awaiter(void 0, void 0, void 0, function* () {
                const { data, error } = yield supabase.storage.from('pdfs').upload(pathToFile, (0, base64_arraybuffer_1.decode)(base64), {
                    contentType: 'application/pdf'
                });
                if (error) {
                    console.log(error);
                }
            }));
            const { data } = supabase.storage.from("pdfs").getPublicUrl(pathToFile);
            return {
                data: worksheetString || "",
                urlToPdf: data.publicUrl
            };
        }
        else {
            return "Failed Request";
        }
    }
    else {
        return "Failed Request";
    }
});
