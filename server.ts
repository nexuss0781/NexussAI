import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const OMNIROUTE_BASE_URL = (process.env.OMNIROUTE_BASE_URL || 'https://omniouter-vercel.vercel.app').replace(/\/+$/, '');
const OMNIROUTE_AI_API_KEY = (process.env.OMNIROUTE_AI_API_KEY || 'my-super-secret-gateway-token-123').trim();
const FILESYSTEM_KIT_URL = (process.env.FILESYSTEM_KIT_URL || 'https://filesystem-kit.wasmer.app').replace(/\/+$/, '');

// ==========================================
// WORKSPACE RESOLUTION & LOCAL FILESYSTEM ENGINE
// Universal Permanent Root Configuration
// ==========================================

function getWorkspaceRoot(): string {
  if (process.env.WORKSPACE_ROOT && fs.existsSync(process.env.WORKSPACE_ROOT)) {
    return path.resolve(process.env.WORKSPACE_ROOT);
  }
  if (process.env.FILESYSTEM_ROOT && fs.existsSync(process.env.FILESYSTEM_ROOT)) {
    return path.resolve(process.env.FILESYSTEM_ROOT);
  }
  return path.resolve(process.cwd());
}

function resolveSafePath(userPath: string = '.'): string {
  const root = getWorkspaceRoot();
  let clean = (userPath || '.').trim();

  // Strip known prefix aliases if passed by callers
  clean = clean.replace(/^\/home\/ubuntu(\/|$)/, './');
  clean = clean.replace(/^\/data(\/|$)/, './');
  clean = clean.replace(/^\/app\/applet(\/|$)/, './');

  // Strip remaining leading slashes
  const normalized = path.normalize(clean.replace(/^[/\\]+/, ''));
  const target = path.resolve(root, normalized || '.');
  
  if (!target.startsWith(root)) {
    return root;
  }
  return target;
}

function getRelativeWorkspacePath(absPath: string): string {
  const root = getWorkspaceRoot();
  const rel = path.relative(root, absPath);
  return rel ? rel.replace(/\\/g, '/') : '.';
}

// 1. list_files
function localListFiles(args: { path?: string; all?: boolean }) {
  const target = resolveSafePath(args.path || '.');
  if (!fs.existsSync(target)) {
    throw new Error(`Directory does not exist: ${args.path || '.'}`);
  }
  const stat = fs.statSync(target);
  if (!stat.isDirectory()) {
    return {
      path: getRelativeWorkspacePath(target),
      type: 'file',
      size: stat.size,
    };
  }

  const entries = fs.readdirSync(target, { withFileTypes: true });
  const showAll = Boolean(args.all);
  const results = entries
    .filter(e => showAll || !e.name.startsWith('.'))
    .map(e => ({
      name: e.name,
      path: getRelativeWorkspacePath(path.join(target, e.name)),
      isDirectory: e.isDirectory(),
      size: e.isFile() ? fs.statSync(path.join(target, e.name)).size : undefined,
      modifiedAt: fs.statSync(path.join(target, e.name)).mtime.toISOString(),
    }));

  return {
    path: getRelativeWorkspacePath(target),
    entries: results,
    count: results.length,
  };
}

// 2. read_file
function localReadFile(args: { path: string; head?: number; tail?: number; start?: number; end?: number; range?: { start?: number; end?: number } }) {
  if (!args.path) throw new Error('Missing "path" parameter');
  const target = resolveSafePath(args.path);
  if (!fs.existsSync(target)) {
    throw new Error(`File not found: ${args.path}`);
  }
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    throw new Error(`Target is a directory, not a file: ${args.path}`);
  }

  const raw = fs.readFileSync(target, 'utf-8');
  const lines = raw.split(/\r?\n/);
  const totalLines = lines.length;

  const startLine = args.range?.start ?? args.start;
  const endLine = args.range?.end ?? args.end;

  let sliced = lines;
  if (startLine !== undefined || endLine !== undefined) {
    const s = Math.max(1, Number(startLine) || 1) - 1;
    const e = endLine !== undefined ? Math.min(totalLines, Number(endLine)) : totalLines;
    sliced = lines.slice(s, e);
  } else if (args.head !== undefined) {
    sliced = lines.slice(0, Math.max(1, Number(args.head)));
  } else if (args.tail !== undefined) {
    sliced = lines.slice(-Math.max(1, Number(args.tail)));
  }

  return {
    path: getRelativeWorkspacePath(target),
    content: sliced.join('\n'),
    totalLines,
    bytes: stat.size,
  };
}

// 3. write_file
function localWriteFile(args: { path: string; content: string; append?: boolean; range?: { start?: number; end?: number } }) {
  if (!args.path) throw new Error('Missing "path" parameter');
  const target = resolveSafePath(args.path);
  const dir = path.dirname(target);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (args.range && fs.existsSync(target)) {
    const raw = fs.readFileSync(target, 'utf-8');
    const lines = raw.split(/\r?\n/);
    const s = Math.max(1, Number(args.range.start) || 1) - 1;
    const e = Math.min(lines.length, Number(args.range.end) || lines.length);
    const newLines = (args.content ?? '').split(/\r?\n/);
    lines.splice(s, e - s, ...newLines);
    fs.writeFileSync(target, lines.join('\n'), 'utf-8');
    return {
      success: true,
      path: getRelativeWorkspacePath(target),
      linesModified: e - s,
    };
  }

  const content = args.content ?? '';
  if (args.append && fs.existsSync(target)) {
    fs.appendFileSync(target, content, 'utf-8');
  } else {
    fs.writeFileSync(target, content, 'utf-8');
  }
  return {
    success: true,
    path: getRelativeWorkspacePath(target),
    bytesWritten: Buffer.byteLength(content),
  };
}

// 4. modify_file
function localModifyFile(args: { 
  path: string; 
  old_str?: string; 
  new_str?: string; 
  match?: string; 
  replacement?: string; 
  rewrite?: string;
  occurrence?: number;
  find?: string; 
  replace?: string; 
  range?: { start?: number; end?: number };
  edits?: Array<{ find: string; replace: string }>;
}) {
  if (!args.path) throw new Error('Missing "path" parameter');
  const target = resolveSafePath(args.path);
  if (!fs.existsSync(target)) {
    throw new Error(`File not found: ${args.path}`);
  }

  // Rewrite line range mode
  if (args.rewrite !== undefined && args.range) {
    const raw = fs.readFileSync(target, 'utf-8');
    const lines = raw.split(/\r?\n/);
    const s = Math.max(1, Number(args.range.start) || 1) - 1;
    const e = Math.min(lines.length, Number(args.range.end) || lines.length);
    const newLines = (args.rewrite ?? '').split(/\r?\n/);
    lines.splice(s, e - s, ...newLines);
    fs.writeFileSync(target, lines.join('\n'), 'utf-8');
    return {
      success: true,
      path: getRelativeWorkspacePath(target),
      rewriteApplied: true,
    };
  }

  let content = fs.readFileSync(target, 'utf-8');
  let changesMade = 0;

  if (args.edits && Array.isArray(args.edits)) {
    for (const edit of args.edits) {
      if (edit.find && content.includes(edit.find)) {
        content = content.replace(edit.find, edit.replace ?? '');
        changesMade += 1;
      }
    }
  } else {
    const findStr = args.match ?? args.old_str ?? args.find;
    const replaceStr = args.replacement ?? args.new_str ?? args.replace ?? '';
    if (findStr) {
      if (!content.includes(findStr)) {
        throw new Error(`Target search string not found in ${args.path}`);
      }
      if (args.occurrence && Number(args.occurrence) > 1) {
        let count = 0;
        let pos = 0;
        let replaced = false;
        while ((pos = content.indexOf(findStr, pos)) !== -1) {
          count++;
          if (count === Number(args.occurrence)) {
            content = content.slice(0, pos) + replaceStr + content.slice(pos + findStr.length);
            replaced = true;
            changesMade = 1;
            break;
          }
          pos += findStr.length;
        }
        if (!replaced) {
          throw new Error(`Occurrence ${args.occurrence} of target string not found in ${args.path}`);
        }
      } else {
        content = content.replace(findStr, replaceStr);
        changesMade += 1;
      }
    }
  }

  fs.writeFileSync(target, content, 'utf-8');
  return {
    success: true,
    path: getRelativeWorkspacePath(target),
    changesApplied: changesMade,
  };
}

// 5. glob_files
function localGlobFiles(args: { pattern?: string; path?: string; cwd?: string }) {
  const root = resolveSafePath(args.cwd || args.path || '.');
  const pattern = (args.pattern || '*').trim();
  const matched: string[] = [];

  const globRegex = new RegExp('^' + pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.') + '$');

  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      const full = path.join(dir, entry.name);
      const rel = getRelativeWorkspacePath(full);
      if (globRegex.test(entry.name) || globRegex.test(rel)) {
        matched.push(rel);
      }
      if (entry.isDirectory()) {
        walk(full);
      }
    }
  };

  walk(root);
  return {
    pattern,
    matches: matched,
    count: matched.length,
  };
}

// 6. grep_files
function localGrepFiles(args: { pattern: string; path?: string; ignoreCase?: boolean; all?: boolean }) {
  if (!args.pattern) throw new Error('Missing "pattern" parameter');
  const root = resolveSafePath(args.path || '.');
  if (!fs.existsSync(root)) {
    throw new Error(`File or directory not found: ${args.path || '.'}`);
  }
  const flags = args.ignoreCase !== false ? 'i' : '';
  const regex = new RegExp(args.pattern, flags);
  const results: Array<{ file: string; line: number; text: string }> = [];

  const stat = fs.statSync(root);
  if (stat.isFile()) {
    try {
      const content = fs.readFileSync(root, 'utf-8');
      const lines = content.split(/\r?\n/);
      lines.forEach((lineText, idx) => {
        if (regex.test(lineText)) {
          results.push({
            file: getRelativeWorkspacePath(root),
            line: idx + 1,
            text: lineText.trim(),
          });
        }
      });
    } catch {
      // ignore
    }
    return {
      pattern: args.pattern,
      matches: results,
      totalMatches: results.length,
    };
  }

  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(full, 'utf-8');
          const lines = content.split(/\r?\n/);
          lines.forEach((lineText, idx) => {
            if (regex.test(lineText)) {
              results.push({
                file: getRelativeWorkspacePath(full),
                line: idx + 1,
                text: lineText.trim(),
              });
            }
          });
        } catch {
          // ignore binary files
        }
      }
    }
  };

  walk(root);
  return {
    pattern: args.pattern,
    matches: results.slice(0, 100),
    totalMatches: results.length,
  };
}

// 7. delete_file
function localDeleteFile(args: { path: string; recursive?: boolean }) {
  if (!args.path) throw new Error('Missing "path" parameter');
  const target = resolveSafePath(args.path);
  if (!fs.existsSync(target)) {
    throw new Error(`File or directory not found: ${args.path}`);
  }
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    fs.rmSync(target, { recursive: Boolean(args.recursive), force: true });
  } else {
    fs.unlinkSync(target);
  }
  return {
    success: true,
    path: getRelativeWorkspacePath(target),
  };
}

function normalizePathForFilesystemKit(rawPath?: string): string {
  if (!rawPath || rawPath === '.' || rawPath === './') return '.';
  const trimmed = rawPath.trim();
  // Strip accidental host container paths like /app/applet/ or /data/
  if (trimmed.startsWith('/app/applet/')) {
    const rel = trimmed.slice('/app/applet/'.length);
    return rel ? `/home/ubuntu/${rel}` : '/home/ubuntu';
  }
  if (trimmed === '/app/applet') {
    return '/home/ubuntu';
  }
  if (trimmed.startsWith('/data/')) {
    const rel = trimmed.slice('/data/'.length);
    return rel ? `/home/ubuntu/${rel}` : '/home/ubuntu';
  }
  if (trimmed === '/data') {
    return '/home/ubuntu';
  }
  // If absolute path starting with /home/ubuntu, preserve it
  if (trimmed.startsWith('/home/ubuntu')) {
    return trimmed;
  }
  // If model passed e.g. /notes.md, map to /home/ubuntu/notes.md
  if (trimmed.startsWith('/')) {
    return `/home/ubuntu${trimmed}`;
  }
  // Relative path e.g. "notes.md"
  return trimmed;
}

// Execute filesystem tool via external FileSystem Kit with persistent /home/ubuntu root
async function callFilesystemKit(name: string, args: Record<string, any>) {
  if (FILESYSTEM_KIT_URL) {
    const sanitizedArgs = { ...args };
    if (sanitizedArgs.path !== undefined) {
      sanitizedArgs.path = normalizePathForFilesystemKit(sanitizedArgs.path);
    }
    if (sanitizedArgs.cwd !== undefined) {
      sanitizedArgs.cwd = normalizePathForFilesystemKit(sanitizedArgs.cwd);
    }

    const request = async (endpoint: string, init?: RequestInit) => {
      const response = await fetch(`${FILESYSTEM_KIT_URL}${endpoint}`, { 
        ...init, 
        headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } 
      });
      const body = await response.text();
      if (!response.ok) {
        try {
          const parsed = JSON.parse(body);
          throw new Error(parsed.message || parsed.error || `Filesystem Kit error (${response.status})`);
        } catch (e: any) {
          if (e.message && !e.message.startsWith('Unexpected')) throw e;
          throw new Error(`Filesystem Kit ${response.status}: ${body.slice(0, 500)}`);
        }
      }
      return (response.headers.get('content-type') || '').includes('application/json') ? JSON.parse(body) : body;
    };
    const query = (values: Record<string, any>) => new URLSearchParams(
      Object.entries(values).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)])
    ).toString();

    switch (name) {
      case 'read_file': return await request(`/api/read?${query(sanitizedArgs)}`);
      case 'write_file': return await request('/api/write', { method: 'PUT', body: JSON.stringify(sanitizedArgs) });
      case 'modify_file': return await request('/api/modify', { method: 'PATCH', body: JSON.stringify(sanitizedArgs) });
      case 'list_files': return await request(`/api/list?${query({ path: sanitizedArgs.path || '.', all: sanitizedArgs.all })}`);
      case 'glob_files': return await request(`/api/glob?${query(sanitizedArgs)}`);
      case 'grep_files': return await request(`/api/grep?${query({ pattern: sanitizedArgs.pattern, path: sanitizedArgs.path || '.', ignoreCase: sanitizedArgs.ignoreCase, all: sanitizedArgs.all })}`);
      case 'delete_file': return await request(`/api/delete?${query(sanitizedArgs)}`, { method: 'DELETE' });
      default: throw new Error(`Unknown filesystem tool: ${name}`);
    }
  }

  // Fallback to local workspace engine if FILESYSTEM_KIT_URL is unconfigured
  switch (name) {
    case 'read_file': return localReadFile(args as any);
    case 'write_file': return localWriteFile(args as any);
    case 'modify_file': return localModifyFile(args as any);
    case 'list_files': return localListFiles(args as any);
    case 'glob_files': return localGlobFiles(args as any);
    case 'grep_files': return localGrepFiles(args as any);
    case 'delete_file': return localDeleteFile(args as any);
    default: throw new Error(`Unknown filesystem tool: ${name}`);
  }
}

// ==========================================
// NEXUSS AI AUTONOMOUS TOOL CALLING PROTOCOL (NTCP)
// ==========================================

export interface NexussToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

export const NEXUSS_TOOL_REGISTRY: NexussToolDefinition[] = [
  { 
    name: 'read_file', 
    description: 'Read contents of a text file from the workspace.', 
    parameters: { 
      type: 'object', 
      properties: { 
        path: { type: 'string', description: 'Relative path to file (e.g. "src/App.tsx")' }, 
        head: { type: 'integer', description: 'Limit to first N lines' }, 
        tail: { type: 'integer', description: 'Limit to last N lines' }, 
        start: { type: 'integer', description: 'Starting line number (1-based)' }, 
        end: { type: 'integer', description: 'Ending line number' } 
      }, 
      required: ['path'] 
    } 
  },
  { 
    name: 'write_file', 
    description: 'Create or replace a text file in the workspace.', 
    parameters: { 
      type: 'object', 
      properties: { 
        path: { type: 'string', description: 'Relative path to file' }, 
        content: { type: 'string', description: 'Exact file text content' }, 
        append: { type: 'boolean', description: 'Set true to append content' } 
      }, 
      required: ['path', 'content'] 
    } 
  },
  { 
    name: 'modify_file', 
    description: 'Replace an exact match string or rewrite a section in a file.', 
    parameters: { 
      type: 'object', 
      properties: { 
        path: { type: 'string', description: 'Relative path to file' }, 
        match: { type: 'string', description: 'Exact target string to replace' }, 
        replacement: { type: 'string', description: 'Replacement string' } 
      }, 
      required: ['path'] 
    } 
  },
  { 
    name: 'list_files', 
    description: 'List immediate files and subdirectories in a folder.', 
    parameters: { 
      type: 'object', 
      properties: { 
        path: { type: 'string', description: 'Folder path (default: ".")' }, 
        all: { type: 'boolean', description: 'Include hidden files' } 
      } 
    } 
  },
  { 
    name: 'glob_files', 
    description: 'Find workspace files matching a glob pattern (e.g. "**/*.tsx", "src/components/*").', 
    parameters: { 
      type: 'object', 
      properties: { 
        pattern: { type: 'string', description: 'Glob search pattern' }, 
        cwd: { type: 'string', description: 'Base directory' } 
      }, 
      required: ['pattern'] 
    } 
  },
  { 
    name: 'grep_files', 
    description: 'Search workspace files for matching text lines or regex.', 
    parameters: { 
      type: 'object', 
      properties: { 
        pattern: { type: 'string', description: 'Search term or regex pattern' }, 
        path: { type: 'string', description: 'File or directory path' }, 
        ignoreCase: { type: 'boolean', description: 'Case-insensitive search' } 
      }, 
      required: ['pattern'] 
    } 
  },
  { 
    name: 'delete_file', 
    description: 'Delete a workspace file or directory (use only when explicitly requested).', 
    parameters: { 
      type: 'object', 
      properties: { 
        path: { type: 'string', description: 'Path to delete' }, 
        recursive: { type: 'boolean', description: 'Recursive delete for directories' } 
      }, 
      required: ['path'] 
    } 
  },
];

// Pure Nexuss Tool Calling Schema Prompt Standard - Universal across ALL LLM architectures
const NEXUSS_TOOL_PROTOCOL_SPEC = `
# NEXUSS PERSISTENT COMPUTER & TOOL CALLING PROTOCOL (NTCP v1.0)
You are Nexuss AI operating on your dedicated persistent computer.
Your filesystem is centralized and persistent across sessions via the external Nexuss FileSystem Kit.
- Persistent Root Directory: \`/home/ubuntu\`
- Your computer's working environment and persistent storage are rooted at \`/home/ubuntu\`.
- All your created files, notes, project files, and workspaces reside under \`/home/ubuntu\`.
- You can refer to paths relative to your home (e.g. \`notes.txt\`, \`src/index.js\`) or as \`/home/ubuntu/...\`.
- For centralized data integrity and system security, operations outside \`/home/ubuntu\` are strictly rejected.

## Available Nexuss Tools:
${JSON.stringify(NEXUSS_TOOL_REGISTRY, null, 2)}

## Nexuss Tool Call Schema:
To invoke a tool, output a strictly formatted Nexuss Tool Block:
<nexuss_tool_call>
{
  "tool": "<tool_name>",
  "parameters": {
    "<parameter_name>": "<value>"
  }
}
</nexuss_tool_call>

You may also call multiple tools simultaneously:
<nexuss_tool_call>
[
  { "tool": "list_files", "parameters": { "path": "." } },
  { "tool": "read_file", "parameters": { "path": "package.json" } }
]
</nexuss_tool_call>

## Protocol Rules:
1. When you need workspace information, output the <nexuss_tool_call> block immediately.
2. The Nexuss Tool Engine will execute the action and return the output inside <nexuss_tool_result> blocks.
3. After receiving <nexuss_tool_result>, continue your thought process and provide your comprehensive answer to the user.
`;


interface ParsedToolCall {
  id?: string;
  name: string;
  args: Record<string, any>;
  rawMatch?: string;
}

// Universal Nexuss Tool Call Extractor supporting single object, arrays, XML tags, and Markdown blocks
function extractNexussToolCalls(content: string): ParsedToolCall[] {
  if (!content) return [];
  const calls: ParsedToolCall[] = [];
  const validTools = new Set(['read_file', 'write_file', 'modify_file', 'list_files', 'glob_files', 'grep_files', 'delete_file']);

  const processJsonPayload = (parsed: any, raw: string) => {
    if (!parsed) return;
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const toolName = item.tool || item.name || item.action || (item.nexuss_tool_call ? item.nexuss_tool_call.tool || item.nexuss_tool_call.name : null);
      if (toolName && typeof toolName === 'string' && validTools.has(toolName.trim())) {
        let args = item.parameters || item.args || item.arguments || (item.nexuss_tool_call ? item.nexuss_tool_call.parameters || item.nexuss_tool_call.args : null) || item;
        const cleanArgs = typeof args === 'object' && args !== null ? { ...args } : {};
        delete (cleanArgs as any).tool;
        delete (cleanArgs as any).name;
        delete (cleanArgs as any).action;
        delete (cleanArgs as any).nexuss_tool_call;
        calls.push({ name: toolName.trim(), args: cleanArgs, rawMatch: raw });
      }
    }
  };

  // Pattern 1: <nexuss_tool_call> ... </nexuss_tool_call> or <tool_call> ... </tool_call>
  const xmlRegex = /<(?:nexuss_tool_call|tool_call|nexuss_action)(?:\s+tool=["']([^"']+)["']|\s+name=["']([^"']+)["'])?>([\s\S]*?)<\/(?:nexuss_tool_call|tool_call|nexuss_action)>/gi;
  let match: RegExpExecArray | null;
  while ((match = xmlRegex.exec(content)) !== null) {
    const directTool = match[1] || match[2];
    const body = match[3]?.trim();
    if (body) {
      try {
        const parsed = JSON.parse(body);
        if (directTool && typeof parsed === 'object' && !Array.isArray(parsed)) {
          parsed.tool = directTool;
        }
        processJsonPayload(parsed, match[0]);
      } catch {
        // Not standard JSON, try key-value or continue
      }
    }
  }

  // Pattern 2: ```nexuss_tool ... ``` or ```tool_call ... ``` or ```nexuss ... ```
  const codeBlockRegex = /```(?:nexuss_tool|tool_call|nexuss_action|nexuss|json_tool)\s*([\s\S]*?)```/gi;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const body = match[1]?.trim();
    if (body) {
      try {
        const parsed = JSON.parse(body);
        processJsonPayload(parsed, match[0]);
      } catch {}
    }
  }

  // Pattern 3: Standard JSON codeblock containing a valid Nexuss tool
  if (calls.length === 0) {
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?\{[\s\S]*?\})\s*```/gi;
    while ((match = jsonBlockRegex.exec(content)) !== null) {
      const body = match[1]?.trim();
      if (body) {
        try {
          const parsed = JSON.parse(body);
          processJsonPayload(parsed, match[0]);
        } catch {}
      }
    }
  }

  return calls;
}

// Cleans raw unparsed Nexuss tool markers from the final user-facing markdown text
function sanitizeFinalOutput(content: string): string {
  if (!content) return '';
  let cleaned = content;
  cleaned = cleaned.replace(/<(?:nexuss_tool_call|tool_call|nexuss_action)[\s\S]*?<\/(?:nexuss_tool_call|tool_call|nexuss_action)>/gi, '');
  cleaned = cleaned.replace(/<(?:nexuss_tool_result|tool_result)[\s\S]*?<\/(?:nexuss_tool_result|tool_result)>/gi, '');
  cleaned = cleaned.replace(/```(?:nexuss_tool|tool_call|nexuss_action|nexuss|json_tool)[\s\S]*?```/gi, '');
  return cleaned.trim();
}

// OmniRouter AI Gateway Chat caller using strictly the 'auto' routing model
async function callOmniRouteChat({
  messages,
  systemInstruction,
  temperature = 0.7,
  signal,
}: {
  messages: Array<{ role: string; content: string }>;
  systemInstruction?: string;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<{ text: string }> {
  const fullSystemInstruction = `${systemInstruction || 'You are Nexuss AI, a high-performance intelligence assistant.'}\n\n${NEXUSS_TOOL_PROTOCOL_SPEC}`;

  const workingMessages: any[] = [
    { role: 'system', content: fullSystemInstruction },
    ...messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: m.content || '',
    })),
  ];

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (signal?.aborted) {
      throw new Error('Request aborted by user');
    }

    // Autonomous Multi-Turn Execution Loop (up to 6 tool cycles)
    let toolCycle = 0;
    let modelSucceeded = false;
    let finalAnswer = '';

    while (toolCycle < 6) {
      if (signal?.aborted) throw new Error('Request aborted by user');

      const payload: any = {
        model: 'auto',
        messages: workingMessages,
        temperature,
      };

      try {
        let fetchSignal: AbortSignal;
        if (signal) {
          fetchSignal = (AbortSignal as any).any 
            ? (AbortSignal as any).any([signal, AbortSignal.timeout(45000)])
            : signal;
        } else {
          fetchSignal = AbortSignal.timeout(45000);
        }

        const response = await fetch(`${OMNIROUTE_BASE_URL}/api/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OMNIROUTE_AI_API_KEY}`,
            'Content-Type': 'application/json',
            'x-omniroute-forwarded': '1',
          },
          body: JSON.stringify(payload),
          signal: fetchSignal,
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          console.warn(`Gateway status ${response.status} for model auto (attempt ${attempt}): ${errText.slice(0, 120)}`);
          break; // Retry attempt
        }

        const data: any = await response.json();
        const choice = data.choices?.[0];
        const message = choice?.message;
        if (!message) {
          break;
        }

        const rawText = message.content || message.reasoning || '';
        const nativeToolCalls = message.tool_calls;
        const textToolCalls = extractNexussToolCalls(rawText);

        const hasNativeCalls = Array.isArray(nativeToolCalls) && nativeToolCalls.length > 0;
        const hasTextCalls = textToolCalls.length > 0;

        // If no tool calls requested, we have reached the final user response
        if (!hasNativeCalls && !hasTextCalls) {
          const cleanOutput = sanitizeFinalOutput(rawText) || rawText;
          if (cleanOutput && cleanOutput.trim().length > 0) {
            finalAnswer = cleanOutput.trim();
            modelSucceeded = true;
            break;
          }
        }

        // Execute Tools Autonomously
        toolCycle += 1;
        workingMessages.push(message);

        // 1. Handle native OpenAI tool calls if returned
        if (hasNativeCalls) {
          for (const toolCall of nativeToolCalls) {
            const fnName = toolCall.function?.name;
            let fnArgs: any = {};
            try {
              fnArgs = JSON.parse(toolCall.function?.arguments || '{}');
            } catch {
              fnArgs = {};
            }

            try {
              const result = await callFilesystemKit(fnName, fnArgs);
              const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
              workingMessages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: resultStr,
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

        // 2. Handle Nexuss standardized tool calls (NTCP)
        if (hasTextCalls) {
          let toolResultsBlock = '';
          for (const call of textToolCalls) {
            try {
              const result = await callFilesystemKit(call.name, call.args);
              const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
              toolResultsBlock += `\n<nexuss_tool_result tool="${call.name}" status="success">\n${resultStr}\n</nexuss_tool_result>`;
            } catch (err: any) {
              toolResultsBlock += `\n<nexuss_tool_result tool="${call.name}" status="error">\nError: ${err.message}\n</nexuss_tool_result>`;
            }
          }

          workingMessages.push({
            role: 'user',
            content: `Nexuss Tool Execution Output:${toolResultsBlock}\n\nPlease proceed with your analysis and deliver the response to the user.`,
          });
        }

      } catch (fetchErr: any) {
        if (fetchErr?.name === 'AbortError' || signal?.aborted) {
          throw new Error('Request aborted by user');
        }
        console.warn(`Gateway auto request error (attempt ${attempt}):`, fetchErr?.message);
        break;
      }
    }

    if (modelSucceeded && finalAnswer) {
      return { text: finalAnswer };
    }

    // Small delay between retry attempts
    if (attempt < maxAttempts) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  throw new Error('OmniRouter auto gateway currently unavailable');
}

// Conversational Chat Endpoint - Purely OmniRouter 'auto' Model Gateway
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

    const defaultSystemInstruction = `You are Nexuss AI, a minimal, ultra-clean, and high-performance AI assistant.
Your communication style is intelligent, polished, structured, and direct.
${deepResearch ? 'DEEPER RESEARCH MODE IS ENABLED: Provide an exhaustive, multi-faceted analysis with Executive Summary, Core Findings, Structural Comparison / Data, and Concrete Action Items.' : 'Provide clear, concise, and beautifully organized answers.'}
${webSearch ? 'Incorporate up-to-date real-world context and structured citations where applicable.' : ''}
Use markdown formatting with bold headings, clean bullet points, code blocks with syntax tags, and concise summaries.`;

    const systemInstruction = customSystemInstruction || defaultSystemInstruction;

    // Route exclusively through OmniRouter Gateway with 'auto' model routing
    try {
      const omniResult = await callOmniRouteChat({
        messages: conversationList,
        systemInstruction,
        temperature: deepResearch ? 0.3 : 0.7,
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
      console.warn('OmniRouter auto gateway error:', omniError?.message || omniError);
    }

    // Return 503 so client's exponential backoff retry handles reconnect
    return res.status(503).json({
      error: 'OmniRouter gateway temporarily busy, retrying connection...',
      retryable: true,
    });
  } catch (err: any) {
    console.error('Server error handling chat:', err);
    return res.status(500).json({
      error: 'Error processing request, retrying...',
      retryable: true,
      details: err?.message,
    });
  }
});

// ==========================================
// REST FILESYSTEM KIT ENDPOINTS (Direct HTTP)
// ==========================================

app.get('/api/list', (req, res) => {
  try {
    const result = localListFiles({
      path: (req.query.path as string) || '.',
      all: req.query.all === 'true',
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: 'request_error', message: err.message });
  }
});

app.get('/api/read', (req, res) => {
  try {
    const result = localReadFile({
      path: (req.query.path as string) || '',
      head: req.query.head ? Number(req.query.head) : undefined,
      tail: req.query.tail ? Number(req.query.tail) : undefined,
      start: req.query.start ? Number(req.query.start) : undefined,
      end: req.query.end ? Number(req.query.end) : undefined,
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(404).json({ error: 'not_found', message: err.message });
  }
});

app.put('/api/write', (req, res) => {
  try {
    const result = localWriteFile({
      path: req.body?.path || (req.query.path as string) || '',
      content: req.body?.content ?? '',
      append: req.body?.append ?? req.query.append === 'true',
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: 'write_error', message: err.message });
  }
});

app.patch('/api/modify', (req, res) => {
  try {
    const result = localModifyFile({
      path: req.body?.path || (req.query.path as string) || '',
      old_str: req.body?.old_str || req.body?.match || req.body?.find,
      new_str: req.body?.new_str || req.body?.replacement || req.body?.replace,
      match: req.body?.match,
      replacement: req.body?.replacement,
      find: req.body?.find,
      replace: req.body?.replace,
      edits: req.body?.edits,
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: 'modify_error', message: err.message });
  }
});

app.get('/api/glob', (req, res) => {
  try {
    const result = localGlobFiles({
      pattern: (req.query.pattern as string) || '*',
      path: (req.query.path as string) || (req.query.cwd as string) || '.',
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: 'glob_error', message: err.message });
  }
});

app.get('/api/grep', (req, res) => {
  try {
    const result = localGrepFiles({
      pattern: (req.query.pattern as string) || '',
      path: (req.query.path as string) || '.',
      ignoreCase: req.query.ignoreCase !== 'false',
      all: req.query.all === 'true',
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: 'grep_error', message: err.message });
  }
});

app.delete('/api/delete', (req, res) => {
  try {
    const result = localDeleteFile({
      path: (req.query.path as string) || req.body?.path || '',
      recursive: req.query.recursive === 'true' || Boolean(req.body?.recursive),
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: 'delete_error', message: err.message });
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

function findStaticDir(): string {
  const candidates = [
    process.env.STATIC_DIR,
    '/public',
    path.resolve(process.cwd(), 'dist'),
    path.resolve(process.cwd(), 'public'),
    '/app/dist',
  ].filter(Boolean) as string[];

  for (const cand of candidates) {
    if (fs.existsSync(cand) && fs.existsSync(path.join(cand, 'index.html'))) {
      return cand;
    }
  }
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return path.resolve(process.cwd(), 'dist');
}

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
    const staticRoot = findStaticDir();
    app.use(express.static(staticRoot));
    app.get('*', (req, res) => {
      const indexPath = path.join(staticRoot, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Nexuss AI</title></head><body><div id="root"></div></body></html>');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexuss AI server is live at http://0.0.0.0:${PORT}`);
  });
}

startServer();
