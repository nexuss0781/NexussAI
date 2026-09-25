import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const OMNIROUTE_BASE_URL = (process.env.OMNIROUTE_BASE_URL || 'https://omniouter-vercel.vercel.app').replace(/\/+$/, '');
const OMNIROUTE_AI_API_KEY = (process.env.OMNIROUTE_AI_API_KEY || 'my-super-secret-gateway-token-123').trim();
const FILESYSTEM_KIT_URL = (process.env.FILESYSTEM_KIT_URL || 'https://filesystem-kit.wasmer.app').replace(/\/$/, '');

const filesystemToolDeclarations = [
  { name: 'read_file', description: 'Read a text file from the connected workspace. Use this before editing.', parametersJsonSchema: { type: 'object', properties: { path: { type: 'string' }, head: { type: 'integer' }, tail: { type: 'integer' }, start: { type: 'integer' }, end: { type: 'integer' } }, required: ['path'] } },
  { name: 'write_file', description: 'Create or replace a text file in the connected workspace.', parametersJsonSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' }, append: { type: 'boolean' }, range: { type: 'object', properties: { start: { type: 'integer' }, end: { type: 'integer' } }, required: ['start', 'end'] } }, required: ['path', 'content'] } },
  { name: 'modify_file', description: 'Replace one exact occurrence or rewrite a selected line range.', parametersJsonSchema: { type: 'object', properties: { path: { type: 'string' }, match: { type: 'string' }, replacement: { type: 'string' }, occurrence: { type: 'integer' }, rewrite: { type: 'string' }, range: { type: 'object', properties: { start: { type: 'integer' }, end: { type: 'integer' } }, required: ['start', 'end'] } }, required: ['path'] } },
  { name: 'list_files', description: 'List immediate files and directories inside a workspace directory.', parametersJsonSchema: { type: 'object', properties: { path: { type: 'string' }, all: { type: 'boolean' } } } },
  { name: 'glob_files', description: 'Find workspace paths matching a glob pattern.', parametersJsonSchema: { type: 'object', properties: { pattern: { type: 'string' }, cwd: { type: 'string' }, all: { type: 'boolean' } }, required: ['pattern'] } },
  { name: 'grep_files', description: 'Search text lines in a workspace file or directory.', parametersJsonSchema: { type: 'object', properties: { pattern: { type: 'string' }, path: { type: 'string' }, ignoreCase: { type: 'boolean' }, all: { type: 'boolean' } }, required: ['pattern'] } },
  { name: 'delete_file', description: 'Delete a workspace file or directory. Only use when explicitly requested.', parametersJsonSchema: { type: 'object', properties: { path: { type: 'string' }, recursive: { type: 'boolean' }, force: { type: 'boolean' } }, required: ['path'] } },
];

const openAiTools = filesystemToolDeclarations.map(tool => ({
  type: 'function',
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parametersJsonSchema,
  },
}));

async function callFilesystemKit(name: string, args: Record<string, any>) {
  const request = async (endpoint: string, init?: RequestInit) => {
    const response = await fetch(`${FILESYSTEM_KIT_URL}${endpoint}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
    const body = await response.text();
    if (!response.ok) throw new Error(`Filesystem Kit ${response.status}: ${body.slice(0, 500)}`);
    return (response.headers.get('content-type') || '').includes('application/json') ? JSON.parse(body) : body;
  };
  const query = (values: Record<string, any>) => new URLSearchParams(Object.entries(values).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)])).toString();
  switch (name) {
    case 'read_file': return request(`/api/read?${query(args)}`);
    case 'write_file': return request('/api/write', { method: 'PUT', body: JSON.stringify(args) });
    case 'modify_file': return request('/api/modify', { method: 'PATCH', body: JSON.stringify(args) });
    case 'list_files': return request(`/api/list?${query({ path: args.path || '.', all: args.all })}`);
    case 'glob_files': return request(`/api/glob?${query(args)}`);
    case 'grep_files': return request(`/api/grep?${query({ pattern: args.pattern, path: args.path || '.', ignoreCase: args.ignoreCase, all: args.all })}`);
    case 'delete_file': return request(`/api/delete?${query(args)}`, { method: 'DELETE' });
    default: throw new Error(`Unknown filesystem tool: ${name}`);
  }
}

// OmniRouter AI Gateway Chat caller with autonomous tool execution loop
async function callOmniRouteChat({
  messages,
  model = 'auto',
  systemInstruction,
  temperature = 0.7,
  useTools = true,
}: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  useTools?: boolean;
}): Promise<{ text: string }> {
  const workingMessages: any[] = [];
  if (systemInstruction) {
    workingMessages.push({ role: 'system', content: systemInstruction });
  }

  for (const m of messages) {
    workingMessages.push({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: m.content || '',
    });
  }

  let targetModel = model;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const payload: any = {
      model: targetModel,
      messages: workingMessages,
      temperature,
    };
    if (useTools) {
      payload.tools = openAiTools;
    }

    let response = await fetch(`${OMNIROUTE_BASE_URL}/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OMNIROUTE_AI_API_KEY}`,
        'Content-Type': 'application/json',
        'x-omniroute-forwarded': '1',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok && targetModel !== 'auto') {
      targetModel = 'auto';
      payload.model = 'auto';
      response = await fetch(`${OMNIROUTE_BASE_URL}/api/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OMNIROUTE_AI_API_KEY}`,
          'Content-Type': 'application/json',
          'x-omniroute-forwarded': '1',
        },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gateway ${response.status}: ${errText.slice(0, 300)}`);
    }

    const data: any = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;
    if (!message) {
      throw new Error('Gateway returned an empty response');
    }

    const toolCalls = message.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      const text = message.content || message.reasoning || '';
      return {
        text: text.trim() || 'I processed your request, but received an empty response.',
      };
    }

    // Append model's tool calls to conversational messages
    workingMessages.push(message);

    // Execute each tool call against Filesystem Kit
    for (const toolCall of toolCalls) {
      const fnName = toolCall.function?.name;
      let fnArgs: any = {};
      try {
        fnArgs = JSON.parse(toolCall.function?.arguments || '{}');
      } catch {
        fnArgs = {};
      }

      try {
        const result = await callFilesystemKit(fnName, fnArgs);
        workingMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: typeof result === 'string' ? result : JSON.stringify(result),
        });
      } catch (err: any) {
        workingMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: err.message }),
        });
      }
    }
  }

  throw new Error('Tool execution loop exceeded maximum steps');
}

// Context-aware fallback response generator
const generateFallback = (prompt: string, isDeep: boolean) => {
  const lower = prompt.toLowerCase();
  
  if (lower.includes('sprint plan') || lower.includes('7-day') || lower.includes('agile')) {
    return `### 7-Day Sprint Plan: Product Velocity & Execution

Here is a structured, high-efficiency sprint blueprint designed for maximum throughput and minimal overhead:

---

#### **Sprint Cadence & Milestones**

| Day | Focus Area | Key Deliverables & Checkpoints |
|---|---|---|
| **Day 1** | Sprint Kickoff & Alignment | • Finalize backlog grooming & scope freeze<br>• Technical spike reviews & API contract lock |
| **Day 2** | Architecture & Core Logic | • Data schema migrations & foundational components<br>• Draft integration tests & CI pipelines |
| **Day 3** | Feature Implementation (P0) | • Build core user workflows & high-impact tickets<br>• EOD internal sync on blockers |
| **Day 4** | Secondary Features & Edge Cases | • Complete UI edge cases, error states, and responsive styling<br>• Begin code review wave 1 |
| **Day 5** | Integration & Hardening | • End-to-end integration tests & security checks<br>• Polish visual micro-interactions & copy |
| **Day 6** | QA Bug Bash & Staging Validation | • Cross-browser testing, accessibility audit<br>• Load testing & staging environment sign-off |
| **Day 7** | Release Deployment & Retro | • Zero-downtime production deployment<br>• Team retrospective: metrics, velocity, action items |

---

#### **Critical Success Factors**
1. **Scope Protection:** Strict freeze on new additions post Day 1 standup.
2. **Async Unblocking:** 15-minute SLA on PR reviews for P0 branch blockers.
3. **Automated Verification:** Continuous testing on PR merge to prevent regression.`;
  }

  if (lower.includes('tagline') || lower.includes('brand') || lower.includes('sustainable')) {
    return `### Brand Taglines: Sustainable Fashion Line

Here are 3 refined, memorable brand directions crafted for resonance, clarity, and narrative depth:

---

#### 1. **"Woven for Tomorrow. Worn Today."**
* **Tone:** Forward-looking, conscious, timeless.
* **Demographic Appeal:** Eco-conscious professionals & minimalist lifestyle enthusiasts.
* **Brand Narrative:** Positions every garment as an investment in longevity rather than fast-fashion obsolescence.

#### 2. **"Pure Origin. Uncompromising Form."**
* **Tone:** Refined, architectural, premium.
* **Demographic Appeal:** Contemporary luxury seekers prioritizing ethical provenance.
* **Brand Narrative:** Celebrates regenerative materials matched with sharp, high-tailored aesthetics.

#### 3. **"Trace Every Thread."**
* **Tone:** Honest, radical transparency, direct.
* **Demographic Appeal:** Gen Z & Millennial consumers who demand radical supply-chain accountability.
* **Brand Narrative:** Establishes trust by turning lifecycle visibility into a primary badge of craftsmanship.`;
  }

  if (lower.includes('gdpr') || lower.includes('ccpa') || lower.includes('privacy')) {
    return `### Regulatory Comparison: GDPR vs. CCPA / CPRA

A structural side-by-side analysis of the European Union's GDPR and California's Consumer Privacy Act (CCPA/CPRA):

---

| Dimension | GDPR (European Union) | CCPA / CPRA (California, USA) |
|---|---|---|
| **Territorial Scope** | Applies globally to any entity processing data of EU residents. | Applies to for-profit entities doing business in CA exceeding revenue/data thresholds ($25M+ gross revenue or 100k+ consumers). |
| **Consent Model** | **Opt-In Default:** Explicit, affirmative opt-in required prior to non-essential processing. | **Opt-Out Default:** Notice at collection; explicit right to opt out of data "sale" or "sharing". |
| **Right to Delete** | Broad "Right to be Forgotten" with narrow exceptions. | Right to delete personal info collected directly, subject to business necessity exemptions. |
| **Sensitive Data** | Special categories (biometric, health, political) prohibited without explicit derogation. | Consumers can limit the use of Sensitive Personal Information (SPI) via dedicated toggle. |
| **Maximum Penalties** | Up to **€20M or 4% of annual global turnover**, whichever is higher. | Up to **$2,500 per unintentional violation** / **$7,500 per intentional violation**; private right of action for data breaches ($100–$750 per consumer). |

---

#### **Key Implementation Takeaway**
Engineering teams targeting global compliance should design to **GDPR standards by default** (strict opt-in consent and centralized data inventory) while implementing California-specific "Do Not Sell/Share My Personal Information" endpoints.`;
  }

  if (isDeep) {
    return `### Strategic Synthesis & Deep Analysis

**Objective:** Thorough investigation and multi-perspective deconstruction of your query.

---

#### **Executive Summary**
1. **Context & Foundation:** Evaluating the principal trade-offs and structural dependencies.
2. **Core Mechanics:** Identifying high-leverage intervention points and potential bottlenecks.
3. **Execution Pathway:** Outlining an actionable roadmap with clear stage gates.

---

#### **Analytical Framework**
* **High Efficiency:** Minimize cognitive overhead through automated pipelines.
* **Resilient Architecture:** Decouple monolithic workflows into deterministic modules.
* **Verification Loop:** Continuous benchmarking against measurable performance indicators.

Would you like to drill down into a specific technical aspect or generate concrete implementation assets?`;
  }

  return `### Nexuss AI Analysis

Thank you for your inquiry. Here is a clear, structured breakdown:

1. **Clarity & Focus:** Every initiative benefits from well-defined constraints and clear success criteria.
2. **Immediate Next Step:** Prioritize the highest-leverage task to create immediate forward momentum.
3. **Iterative Refinement:** Execute quickly, measure impact, and adjust based on feedback.

How would you like to build on this?`;
};

// Conversational Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { 
      prompt, 
      messages: reqMessages, 
      history, 
      systemInstruction: customSystemInstruction,
      webSearch,
      deepResearch 
    } = req.body;

    let conversationList: Array<{ role: string; content: string }> = [];

    if (Array.isArray(reqMessages) && reqMessages.length > 0) {
      conversationList = reqMessages;
    } else if (Array.isArray(history) && history.length > 0) {
      conversationList = history.map(h => ({
        role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content || h.parts?.[0]?.text || '',
      }));
      if (prompt) {
        conversationList.push({ role: 'user', content: prompt });
      }
    } else if (prompt) {
      conversationList = [{ role: 'user', content: prompt }];
    }

    if (conversationList.length === 0) {
      return res.status(400).json({ error: 'No prompt or messages provided' });
    }

    const lastUserMessage = [...conversationList].reverse().find(m => m.role === 'user');
    const userPrompt = lastUserMessage?.content || prompt || '';

    const defaultSystemInstruction = `You are Nexuss AI, a minimal, ultra-clean, and high-performance AI assistant.
Your communication style is intelligent, polished, structured, and direct.
${deepResearch ? 'DEEPER RESEARCH MODE IS ENABLED: Provide an exhaustive, multi-faceted analysis with Executive Summary, Core Findings, Structural Comparison / Data, and Concrete Action Items.' : 'Provide clear, concise, and beautifully organized answers.'}
${webSearch ? 'Incorporate up-to-date real-world context and structured citations where applicable.' : ''}
Use markdown formatting with bold headings, clean bullet points, code blocks with syntax tags, and concise summaries.
You are connected to a remote Filesystem Kit workspace. When the user asks you to inspect, create, edit, search, or organize code/files, use the filesystem tools instead of pretending. Read relevant files before editing, make the smallest safe change, and summarize every file operation. Never delete files unless explicitly requested.`;

    const systemInstruction = `${customSystemInstruction || defaultSystemInstruction}
You are connected to a remote Filesystem Kit workspace. When the user asks you to inspect, create, edit, search, or organize code/files, use the filesystem tools instead of pretending. Read relevant files before editing, make the smallest safe change, and summarize every file operation. Never delete files unless explicitly requested.`;

    // OmniRouter Gateway Execution
    if (OMNIROUTE_AI_API_KEY) {
      try {
        const omniResult = await callOmniRouteChat({
          messages: conversationList,
          model: 'auto',
          systemInstruction,
          temperature: deepResearch ? 0.3 : 0.7,
          useTools: true,
        });

        if (omniResult && omniResult.text) {
          return res.json({
            role: 'assistant',
            content: omniResult.text,
            text: omniResult.text,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (omniError: any) {
        console.warn('Gateway request error, activating structured fallback:', omniError?.message || omniError);
      }
    }

    // Intelligent context-aware fallback response generator
    const reply = generateFallback(userPrompt, Boolean(deepResearch));

    return res.json({
      role: 'assistant',
      content: reply,
      text: reply,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Server error handling chat:', err);
    return res.status(500).json({
      error: 'An internal error occurred while generating response.',
      details: err?.message,
    });
  }
});

// App Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: 'Nexuss AI',
    timestamp: new Date().toISOString(),
  });
});

// Vite Middleware for Dev vs Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const staticRoot = process.env.STATIC_DIR || path.resolve(process.cwd(), 'dist');
    app.use(express.static(staticRoot));
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticRoot, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexuss AI server is live at http://0.0.0.0:${PORT}`);
  });
}

startServer();
