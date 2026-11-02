import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

interface RIASECScoresPayload {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_NAME = 'gemini-3.8-flash';

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isValidScores(scores: unknown): scores is RIASECScoresPayload {
  if (!scores || typeof scores !== 'object') return false;
  const s = scores as Record<string, unknown>;
  return (
    typeof s.R === 'number' &&
    typeof s.I === 'number' &&
    typeof s.A === 'number' &&
    typeof s.S === 'number' &&
    typeof s.E === 'number' &&
    typeof s.C === 'number'
  );
}

function buildCareerGuidanceSystemPrompt(scores: RIASECScoresPayload): string {
  return `
    أنت مستشار مهني ذكي ورؤيوي في برنامج بوصلتي.
    بناءً على نتائج RIASEC للطالب: الواقعي:${scores.R}/25، الاستقصائي:${scores.I}/25، الفني:${scores.A}/25، الاجتماعي:${scores.S}/25، المغامر:${scores.E}/25، التقليدي:${scores.C}/25.
    
    القواعد الإرشادية للحوار:
    1. أجب على أسئلة الطالب بذكاء وثقة بصفته طالباً في مدرسة أحمد اللوزي الثانوية للبنين.
    2. اربط كل إجابة بنقاط قوته المكتشفة من الاختبار.
    3. قدم أمثلة من سوق العمل الأردني الحديث (مثل قطاعات الأمن السيبراني، الاستدامة، التقنية المالية، الفنون الرقمية).
    4. حافظ على نبرة محفزة، عملية، وراقية.
    5. لا تطل في الإجابة، اجعلها مركزة ومفيدة.
  `;
}

function buildInitialAnalysisPrompt(scores: RIASECScoresPayload): string {
  return `
    بناءً على نتائج مقياس هولاند (RIASEC) للطالب:
    R:${scores.R}, I:${scores.I}, A:${scores.A}, S:${scores.S}, E:${scores.E}, C:${scores.C}
    (الدرجة القصوى لكل نمط هي 25).
    
    قم بكتابة تقرير تحليلي احترافي للطالب باستخدام التنسيق التالي بدقة:
    
    ### هويتك المهنية
    اكتب وصفاً ملهماً (3-4 أسطر) يدمج أعلى نمطين لديه في شخصية مهنية واحدة (مثال: المعماري الاجتماعي، أو المحلل القيادي).
    
    ### نقاط القوة الاستراتيجية
    - اذكر 3 نقاط قوة حقيقية بناءً على الأرقام.
    
    ### بيئات الإبداع المثالية
    - صف أين سيبدع الطالب (ميدان، مختبر، مكتب منظم، استوديو فني..).
    
    ### تخصصات المستقبل المقترحة
    - اقترح 5 تخصصات جامعية حديثة ومطلوبة عالمياً ومحلياً تتوافق مع هذه النتائج.
    
    اجعل اللغة العربية فصحى، راقية، ومحفزة جداً. لا تستخدم مقدمات، ابدأ بالتقرير مباشرة.
  `;
}

const INITIAL_ANALYSIS_SYSTEM_INSTRUCTION =
  'أنت خبير عالمي في التخطيط المهني وتطوير الكفاءات البشرية، تعمل ضمن لجنة التوجيه والإرشاد في مدرسة أحمد اللوزي الثانوية للبنين.';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));

  // Career Guidance Q&A (JSON)
  app.post('/api/gemini/guidance', async (req: Request, res: Response) => {
    const { scores, userInput } = req.body as {
      scores?: unknown;
      userInput?: unknown;
    };

    if (!isValidScores(scores) || typeof userInput !== 'string' || !userInput.trim()) {
      res.status(400).json({ error: 'بيانات الطلب غير صالحة.' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({
        error: 'MISSING_API_KEY',
        text: 'نظام الذكاء الاصطناعي غير مفعل حالياً. يرجى التأكد من إعدادات الربط.',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: userInput,
        config: {
          systemInstruction: buildCareerGuidanceSystemPrompt(scores),
        },
      });
      res.json({
        text: response.text || 'عذراً، لم أستطع تحليل السؤال حالياً.',
      });
    } catch (error: unknown) {
      console.error('Gemini Guidance Error:', error);
      const errMessage =
        error instanceof Error ? error.message : 'حدث خطأ أثناء التواصل مع المستشار الذكي.';
      res.status(500).json({
        error: errMessage,
        text: 'حدث خطأ أثناء التواصل مع المستشار الذكي. يرجى المحاولة لاحقاً.',
      });
    }
  });

  // Career Guidance Q&A (SSE Stream)
  app.post('/api/gemini/guidance/stream', async (req: Request, res: Response) => {
    const { scores, userInput } = req.body as {
      scores?: unknown;
      userInput?: unknown;
    };

    if (!isValidScores(scores) || typeof userInput !== 'string' || !userInput.trim()) {
      res.status(400).json({ error: 'بيانات الطلب غير صالحة.' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({
        error: 'MISSING_API_KEY',
        text: 'نظام الذكاء الاصطناعي غير مفعل حالياً. يرجى التأكد من إعدادات الربط.',
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const stream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: userInput,
        config: {
          systemInstruction: buildCareerGuidanceSystemPrompt(scores),
        },
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: unknown) {
      console.error('Gemini Guidance Stream Error:', error);
      const errMessage =
        error instanceof Error ? error.message : 'حدث خطأ أثناء التواصل مع المستشار الذكي.';
      res.write(
        `data: ${JSON.stringify({
          error: errMessage,
          text: 'حدث خطأ أثناء التواصل مع المستشار الذكي. يرجى المحاولة لاحقاً.',
        })}\n\n`
      );
      res.end();
    }
  });

  // Initial RIASEC Strategic Analysis (JSON)
  app.post('/api/gemini/initial-analysis', async (req: Request, res: Response) => {
    const { scores } = req.body as { scores?: unknown };

    if (!isValidScores(scores)) {
      res.status(400).json({ error: 'بيانات النتائج غير صالحة.' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({
        error: 'MISSING_API_KEY',
        text: 'أنت تمتلك مزيجاً فريداً من المهارات! ابدأ باستكشاف خياراتك المهنية مع مرشدك.',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: buildInitialAnalysisPrompt(scores),
        config: {
          systemInstruction: INITIAL_ANALYSIS_SYSTEM_INSTRUCTION,
        },
      });
      res.json({
        text: response.text || 'تحليل رائع بانتظارك! ابدأ الحوار مع المستشار لمعرفة المزيد.',
      });
    } catch (error: unknown) {
      console.error('Gemini Initial Analysis Error:', error);
      const errMessage =
        error instanceof Error ? error.message : 'حدث خطأ أثناء توليد التحليل الأولي.';
      res.status(500).json({
        error: errMessage,
        text: 'أنت تمتلك بصمة مهنية فريدة تجمع بين مهارات متميزة. استكشف نتائجك وتحدث مع المستشار الذكي.',
      });
    }
  });

  // Initial RIASEC Strategic Analysis (SSE Stream)
  app.post('/api/gemini/initial-analysis/stream', async (req: Request, res: Response) => {
    const { scores } = req.body as { scores?: unknown };

    if (!isValidScores(scores)) {
      res.status(400).json({ error: 'بيانات النتائج غير صالحة.' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({
        error: 'MISSING_API_KEY',
        text: 'أنت تمتلك مزيجاً فريداً من المهارات! ابدأ باستكشاف خياراتك المهنية مع مرشدك.',
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const stream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: buildInitialAnalysisPrompt(scores),
        config: {
          systemInstruction: INITIAL_ANALYSIS_SYSTEM_INSTRUCTION,
        },
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: unknown) {
      console.error('Gemini Initial Analysis Stream Error:', error);
      const errMessage =
        error instanceof Error ? error.message : 'حدث خطأ أثناء توليد التحليل الأولي.';
      res.write(
        `data: ${JSON.stringify({
          error: errMessage,
          text: 'أنت تمتلك بصمة مهنية فريدة تجمع بين مهارات متميزة. استكشف نتائجك وتحدث مع المستشار الذكي.',
        })}\n\n`
      );
      res.end();
    }
  });

  const distPath = path.join(__dirname, 'dist');
  const isDevLifecycle = process.env.npm_lifecycle_event === 'dev';
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (!isDevLifecycle &&
      process.env.NODE_ENV !== 'development' &&
      fs.existsSync(path.join(distPath, 'index.html')));

  const listenPort = isProduction ? PORT : 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('/{*path}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(listenPort, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${listenPort}`);
  });
}

startServer();
