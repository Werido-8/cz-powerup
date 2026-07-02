import fs from "fs";
import path from "path";

const root = path.resolve("src");
const srcPath = path.join(root, "routes/exam-admin.tsx");
const lines = fs.readFileSync(srcPath, "utf8").split(/\r?\n/);

const sharedImports = lines.slice(0, 122).join("\n");
const sharedUtils = lines.slice(144, 260).join("\n");

const reviewBlock = lines.slice(260, 1346).join("\n").replace("function ReviewModule", "export function ReviewModule");
const bankBlock = lines.slice(1346, 2599).join("\n").replace("function BankModule", "export function BankModule");

const examDir = path.join(root, "components/exam");

fs.writeFileSync(path.join(examDir, "review-module.tsx"), `${sharedImports}\n${sharedUtils}\n${reviewBlock}\n`);
fs.writeFileSync(path.join(examDir, "bank-module.tsx"), `${sharedImports}\n${sharedUtils}\n${bankBlock}\n`);

console.log("Extracted review-module and bank-module");
