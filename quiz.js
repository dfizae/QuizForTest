const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();

const keyword = process.argv[2] || "소프트웨어 설계";
const count = process.argv[3] || "10";
const difficulty = process.argv[4] || "중";

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // 최신 Pro 모델 사용 (필요시 flash로 변경 가능)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // 1. 기본 프롬프트 템플릿 읽기
  let prompt = fs.readFileSync('prompt_template.txt', 'utf8');

  // 2. 출제 범위 파일(scope.txt) 읽기 (파일이 없으면 빈칸 처리)
  let scopeText = "자유롭게 출제하세요.";
  if (fs.existsSync('scope.txt')) {
    scopeText = fs.readFileSync('scope.txt', 'utf8');
    console.log("📂 [scope.txt] 파일의 세부 출제 범위를 적용합니다.");
  }

  // 3. 변수 치환
  prompt = prompt.replace(/{{세부_출제범위}}/g, scopeText);
  prompt = prompt.replace(/{{과목_키워드}}/g, keyword);
  prompt = prompt.replace(/{{문제_수}}/g, count);
  prompt = prompt.replace(/{{난이도}}/g, difficulty);

  console.log(`\n⏳ [${keyword}] 퀴즈 ${count}문제(${difficulty} 난이도) 생성 중...\n`);

  try {
    const result = await model.generateContent(prompt);
    console.log("================ 완성된 퀴즈 ================\n");
    console.log(result.response.text());
    console.log("\n=============================================");
  } catch (error) {
    console.error("오류가 발생했습니다:", error);
  }
}

run();