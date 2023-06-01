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
const openai_1 = require("openai");
const config = new openai_1.Configuration({
    apiKey: process.env.OPEN_AI_API_KEY
});
const openai = new openai_1.OpenAIApi(config);
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
app.get("/mc", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.time();
    const userSecret = req.query.secret;
    if (userSecret != process.env.SECRET) {
        res.json("Unauthorized Request");
    }
    else {
        const prompt = req.query.prompt;
        const num = req.query.num;
        let parsedNum = 0;
        if (prompt) {
            if (num) {
                parsedNum = parseInt(num.toString());
            }
            else {
                parsedNum = 3;
            }
            const stringifiedPrompt = prompt.toString();
            const response = yield getMcTest(stringifiedPrompt, parsedNum);
            console.timeEnd();
            res.json(response);
        }
    }
}));
app.listen(process.env.PORT, () => {
    console.log(`app running on http://localhost:${process.env.PORT}`);
});
const getMcTest = (subject, num) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield openai.createCompletion({
        model: "text-davinci-003",
        prompt: "create a practice " + subject + " multiple choice test with " + num + " questions in a JSON format",
        max_tokens: 2020,
        temperature: 0.1,
    });
    const output = response.data.choices[0].text;
    console.log(output);
    if (output) {
        return output;
    }
    else {
        return "Failed request";
    }
});
