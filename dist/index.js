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
const body_parser_1 = __importDefault(require("body-parser"));
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
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.get("/", (req, res) => {
    const userSecret = req.query.secret;
    if (!userSecret || userSecret != process.env.SECRET) {
        res.json("Unauthorized");
    }
    else {
        res.json("Authorized");
    }
});
app.post("/worksheet", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userSecret = req.query.secret;
    if (userSecret != process.env.SECRET) {
        res.json("Unauthorized Request");
    }
    else {
        console.log(req.body);
        const response = yield getWorksheet(req.body);
        res.json(response);
    }
}));
app.listen(process.env.PORT, () => {
    console.log(`app running on http://localhost:${process.env.PORT}`);
});
const getWorksheet = ({ subject, topic, title, num }) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(subject, topic, title, num);
    const prompt = `Create a(n) ${subject} ${topic} worksheet with ${num} questions. Do not put the answers below the question and only list the correct answers at the bottom headed with "answers" and add space after each question.`;
    const result = yield client.generateText({
        model: MODEL_NAME,
        temperature: 0,
        prompt: {
            text: prompt,
        },
    });
    if (result && result[0].candidates) {
        const worksheetString = result[0].candidates[0].output;
        const worksheetStringArr = worksheetString === null || worksheetString === void 0 ? void 0 : worksheetString.split("Answers");
        if (worksheetStringArr) {
            const docDef = {
                content: [
                    "\n",
                    { text: title, style: 'header' },
                    "\n",
                    worksheetStringArr[0],
                    { text: worksheetStringArr[1], pageBreak: 'before' },
                ],
                styles: {
                    header: {
                        fontSize: 22,
                        bold: true
                    }
                }
            };
            const pathToFile = `worksheets/${(0, uid_1.uid)()}`;
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
                urlToPdf: data.publicUrl,
                pathToFile: pathToFile
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
