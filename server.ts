import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Serve static csv_files directly
app.use('/csv_files', express.static(path.resolve(__dirname, 'public', 'csv_files')));

// Explicit handler for ALL EQUITY DETAILS.CSV
app.get(['/csv_files/ALL EQUITY DETAILS.CSV', '/csv_files/ALL_EQUITY_DETAILS.CSV', '/api/equity-details-csv'], (_req: Request, res: Response) => {
  const filePath = path.resolve(__dirname, 'public', 'csv_files', 'ALL EQUITY DETAILS.CSV');
  res.sendFile(filePath);
});

// Server-side Gemini initialization with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * AI Interpretation Endpoint
 * CORE PRINCIPLE: "CODE CALCULATES. AI INTERPRETS."
 * Receives only deterministic calculation outputs and explains the findings factually.
 */
app.post('/api/gemini/interpret', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, calculationType, summaryStats, compactTable, universeNotes } = req.body;

    if (!question && !compactTable) {
      res.status(400).json({ error: 'Missing calculation table or question.' });
      return;
    }

    const systemPrompt = `You are an expert quantitative financial research assistant specializing in historical stock market behavior for Indian equities (NSE/BSE) during NIFTY 50 corrections.

CORE OPERATIONAL PRINCIPLES:
1. CODE CALCULATES. AI INTERPRETS.
   - All numbers in the prompt were calculated deterministically by application code from historical OHLC data.
   - NEVER invent, extrapolate, or guess any new numerical figures or statistics.
   - Strictly interpret ONLY the numbers provided in the input table and summary.
2. ABSOLUTELY NO BUY OR SELL RECOMMENDATIONS:
   - Do NOT provide "Buy", "Sell", "Hold", "Accumulate", or "Target" recommendations.
   - This dashboard is purely for historical research, academic understanding, and statistical analysis.
3. STATISTICAL INTEGRITY & DISCLAIMERS:
   - Always clarify that historical rebounds during past market corrections do not guarantee or predict future returns.
   - If sample sizes are small (e.g. n < 5 occurrences), prominently warn that statistical reliability is limited.
   - Highlight variations across market cap tiers (High-Cap vs Mid-Cap vs Small-Cap) and sectors if evident in the data.
4. TONE & STRUCTURE:
   - Provide an objective, structured summary:
     * Executive Synthesis (2-3 concise bullets)
     * Key Quantitative Findings (referencing specific symbols, returns, drawdowns, and days-to-recovery from the provided table)
     * Risk & Sample Size Notes
     * Historical Context Disclaimer`;

    const userPrompt = `USER RESEARCH QUESTION:
"${question || 'Analyze the historical rebound and correction metrics from the calculated dataset.'}"

CALCULATION ENGINE:
${calculationType || 'Historical Rebound Engine'}

AGGREGATE DETERMINISTIC STATS:
${JSON.stringify(summaryStats || {}, null, 2)}

VERIFIED DETERMINISTIC RESULT TABLE (Top qualifying historical observations):
${JSON.stringify(compactTable || [], null, 2)}

UNIVERSE / SAMPLE NOTES:
${universeNotes || 'Calculated strictly from historical daily OHLC data of Indian equities universe across historical NIFTY 50 correction windows.'}

Please provide an objective, data-grounded interpretation of these verified calculations without inventing any numbers or giving investment recommendations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // Low temperature for high factual adherence to numbers
      },
    });

    const interpretation = response.text || 'No interpretation generated.';

    res.json({
      success: true,
      interpretation,
      source: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Error generating interpretation with Gemini:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate interpretation.',
      fallback: 'Historical calculations remain valid. Gemini interpretation service encountered an error.',
    });
  }
});

// Mount Vite middleware in development or static dist in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Historical Rebound Research Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
