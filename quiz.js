const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();
 
const topic = process.argv[2] || "소프트웨어 설계";
const count = process.argv[3] || "5";

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // 최신 Pro 모델 사용 (필요시 flash로 변경 가능)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
  prompt = prompt.replace(/{{회차}}/g, topic);
  prompt = prompt.replace(/{{문제_수}}/g, count);

  console.log(`\n⏳ [${topic}] 주제로 퀴즈 ${count}문제 생성 중...\n`);

  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      console.log("================ 완성된 퀴즈 ================\n");
      console.log(result.response.text());
      console.log("\n=============================================");
      return;
    } catch (error) {
      if (error.status === 429) {
        retryCount++;
        const retryDelay = error.errorDetails?.find(d => d['@type']?.includes('RetryInfo'))?.retryDelay;
        let waitTime = 60000; // 기본값: 60초

        if (retryDelay) {
          const seconds = parseInt(retryDelay);
          waitTime = seconds * 1000;
        }

        if (retryCount < maxRetries) {
          const waitSeconds = Math.ceil(waitTime / 1000);
          console.log(`⏱️ 할당량 초과. ${waitSeconds}초 후 재시도 (${retryCount}/${maxRetries})...\n`);
          await wait(waitTime);
        } else {
          console.error("오류가 발생했습니다: 최대 재시도 횟수 초과\n", error.message);
        }
      } else {
        console.error("오류가 발생했습니다:", error.message);
        return;
      }
    }
  }
}

run();