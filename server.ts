import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for JSON parsing
app.use(express.json());

// Initialize Gemini Client safely
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn('GEMINI_API_KEY environment variable is not defined. AI features will fallback to client-side rule engines.');
}

// System instructions for the ISP Context AI
const SYSTEM_INSTRUCTION = `You are DigiNet's senior AI Assistant (DigiNet AI), an expert virtual engineer specializing in ISP and GPON field operations in Albania.
Your knowledge includes:
- GPON/EPON fiber optic networks, ONT/OLT configuration and optical troubleshooting.
- Common ONT/ONU models: Huawei HG8245H, ZTE F660, Nokia G-010G-P, Nokia G-2425G-A.
- MikroTik RouterOS setup (PPPoE, WAN DHCP, queues, NAT, basic firewalling).
- IPTV systems, multicast/IGMP snooping, set-top box protocols and stream issues.
- Fiber splicing, OTDR reading, signal level interpretation (dBm meter ranges, optimal -15 to -24 dBm, low light <= -27 dBm).
- Albanian ISP operational scenarios (districts in Tiranë, Durrës, common ISP hardware, regulatory aspects).
- Direct, descriptive, practical, actionable instructions for technicians on site or detailed, scannable summaries for operations.

Always respond in elegant, clear, and professional Albanian (Shqip), unless explicitly requested otherwise. Keep technician guides highly concise and troubleshooting steps structured in numbered bullet points.`;

// API Endpoint: Smart Ticket Categorization (Operator helper)
app.post('/api/ai/categorize', async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  if (!ai) {
    // Fallback if AI key is missing
    return res.json({
      category: 'other',
      priority: 'P3',
      techSkills: 'Teknik i Përgjithshëm',
      explanation: 'Sistemi AI është në demo mode pa çelës shpjegues. Kategoria u vendos si klasike.'
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analizo përshkrimin e mëposhtëm të ankesës së klientit të ISP-së DigiNet dhe sugjero:
1. Kategorinë më të mirë midis: "no_internet", "slow_speed", "intermittent", "no_signal", "equipment", "installation", "other"
2. Prioritetin e incidentit midis: "P1" (Kritik/Ndërprerje totale), "P2" (I lartë), "P3" (Mesatar), "P4" (I ulët)
3. Aftësitë ose mjetet që tekniku duhet të ketë (p.sh. makinerie saldimi fiber, Winbox, etj.)
4. Një shpjegim të shkurtër në Shqip se pse u përzgjodh ky konfigurim.

Përshkrimi i ankesës: "${description}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: 'One of the categories' },
            priority: { type: Type.STRING, description: 'P1, P2, P3, or P4' },
            techSkills: { type: Type.STRING, description: 'Required skills or devices for technician' },
            explanation: { type: Type.STRING, description: 'Short justification in Albanian' }
          },
          required: ['category', 'priority', 'techSkills', 'explanation']
        }
      }
    });

    const resultText = response.text ? response.text.trim() : '{}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Error during AI categorization:', error);
    res.status(500).json({ error: error.message || 'AI request failed' });
  }
});

// API Endpoint: Field Troubleshooting Guide (Technician helper)
app.post('/api/ai/diagnose', async (req, res) => {
  const { problem, clientDetails } = req.body;
  if (!problem) {
    return res.status(400).json({ error: 'Problem description is required' });
  }

  if (!ai) {
    return res.json({
      guide: '### Udhëzues i Shpejtë (Demo Mode)\n\n1. Kontrolloni lidhjen fizike të ushqyesit dhe kabllit të verdhë optik.\n2. Provoni një reset të plotë të ONT-së për 10 sekonda.\n3. Matni fuqinë e dritës optike me Power Meter.'
    });
  }

  try {
    const prompt = `Unë jam tekniku i terenit në rrugë te klienti. Klienti përdor pajisjen ${clientDetails?.routerModel || 'ONT standard'} (Serial: ${clientDetails?.ontSerial || 'nuk dihet'}) në zonën ${clientDetails?.zone || 'Tiranë'}. 
Problemi i raportuar apo i konstatuar:
"${problem}"

Më jep një udhëzues të shpejtë teknik hap pas hapi mënjanimi, me opsionet e mundshme të dëmtimeve (saldim i dëmtuar, vlerat e dritës optike në dBm, konfigurimet PPPoE, rëndësinë e pastrimit të lidhësve, etj.).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    res.json({ guide: response.text });
  } catch (error: any) {
    console.error('Error during AI diagnosis:', error);
    res.status(500).json({ error: error.message || 'AI request failed' });
  }
});

// API Endpoint: Pattern & Trend Analysis (Admin/Engineer helper)
app.post('/api/ai/insights', async (req, res) => {
  const { tickets, infrastructure } = req.body;

  if (!ai) {
    return res.json({
      insights: [
        'Zgjidhshmëria e biletave për sot është në nivel optimal.',
        'Mungesa e lidhjes kryesore në Don Bosko vazhdon të dëmtojë kohën e SLA-së.',
        'Saldimet e dëmtuara mbeten shkaku kryesor i bllokimeve të fibrave.'
      ]
    });
  }

  try {
    const prompt = `Analizo këto të dhëna operacionale të DigiNet ISP për të gjetur anomali, performancën e teknikëve, dështimet e shpeshta dhe sugjerime të mirëmbajtjes parandaluese.
Kthe një listë me saktësisht 4 pika shumë interesante (insights) në gjuhën Shqipe.

Statistikat e biletave aktive:
${JSON.stringify(tickets || [])}

Problemet e infrastrukturës:
${JSON.stringify(infrastructure || [])}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array of exactly 4 actionable insights in Albanian'
            }
          },
          required: ['insights']
        }
      }
    });

    const resultText = response.text ? response.text.trim() : '{"insights":[]}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Error during AI insights:', error);
    res.status(500).json({ error: error.message || 'AI request failed' });
  }
});

// API Endpoint: General AI Chat Assistant (floating sidebar chat)
app.post('/api/ai/chat', async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!ai) {
    return res.json({
      reply: 'Më vjen keq, por çelësi i API nuk është i pranishëm aktualisht për të mbajtur një bisedë inteligjente aktive mbarëkombëtare. Por jam i gatshëm t\'ju ndihmoj sapo të regjistroni çelësin GEMINI_API_KEY!'
    });
  }

  try {
    // Construct simple history array compatible with gemini input if needed
    // or just pass a nicely formatted context
    const formattedHistory = (chatHistory || []).map((h: any) => {
      return `${h.sender === 'user' ? 'Klient/Përdorues' : 'AI Assistant'}: ${h.text}`;
    }).join('\n');

    const prompt = `Biseda e mëparshme:\n${formattedHistory}\n\nPyetja e re:\n"${message}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Error during AI chat:', error);
    res.status(500).json({ error: error.message || 'AI chat request failed' });
  }
});

// API Endpoint: Auto-summary report (Albanian language)
app.post('/api/ai/summarize', async (req, res) => {
  const { tickets, date } = req.body;

  if (!ai) {
    return res.json({
      summary: 'Raport i Përgjithshëm: Biletat po përpunohen rregullisht. Koha mesatare e MTTR është brenda parametrave të paracaktuar të SLA-ve tona në Shqipëri.'
    });
  }

  try {
    const prompt = `Krijo një përmbledhje ekzekutive të shkurtër dhe të detajuar për biletat e datës ${date || 'sotme'} në gjuhën Shqipe për drejtuesit e kompanisë DigiNet.
Aktiviteti i biletave: ${JSON.stringify(tickets || [])}
Specifiko numrin e biletave të hapura / të mbyllura të ditës, dështimet më të rënda dhe performancën e ndërhyrjeve.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error('Error during AI summary:', error);
    res.status(500).json({ error: error.message || 'AI request failed' });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // If development environment
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Mount Vite middleware
    app.use(vite.middlewares);
  } else {
    // If production environment
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DigiNet App Server] running on http://localhost:${PORT}`);
  });
}

startServer();
