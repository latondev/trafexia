import type { CapturedRequest, AppSettings, ApkAnalysisResult } from '../../../shared/types';
import type { TrafficStorage } from './TrafficStorage';
import { DEFAULT_SETTINGS } from '../../../shared/types';
import * as fs from 'fs';
import * as path from 'path';

export class AiService {
  private storage: TrafficStorage;

  constructor(storage: TrafficStorage) {
    this.storage = storage;
  }

  /**
   * Helper function to clean literal newlines, carriage returns, tabs, and escape issues inside JSON strings.
   */
  private cleanJsonString(raw: string): string {
    let inString = false;
    let escaped = false;
    let result = '';

    for (let i = 0; i < raw.length; i++) {
      const char = raw[i];

      if (inString) {
        if (escaped) {
          result += char;
          escaped = false;
        } else if (char === '\\') {
          const nextChar = raw[i + 1];
          if (nextChar && /["\\\/bfnrtu]/.test(nextChar)) {
            result += char;
            escaped = true;
          } else {
            result += '\\\\';
          }
        } else if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else if (char === '"') {
          inString = false;
          result += char;
        } else {
          result += char;
        }
      } else {
        if (char === '"') {
          inString = true;
        }
        result += char;
      }
    }
    return result;
  }

  /**
   * Helper function to repair truncated JSON strings by closing unclosed double quotes,
   * square brackets, and curly braces.
   */
  private repairTruncatedJson(raw: string): string {
    let inString = false;
    let escaped = false;
    const bracketStack: string[] = [];
    let result = '';

    for (let i = 0; i < raw.length; i++) {
      const char = raw[i];
      result += char;

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
      } else {
        if (char === '"') {
          inString = true;
        } else if (char === '{' || char === '[') {
          bracketStack.push(char);
        } else if (char === '}') {
          if (bracketStack[bracketStack.length - 1] === '{') {
            bracketStack.pop();
          }
        } else if (char === ']') {
          if (bracketStack[bracketStack.length - 1] === '[') {
            bracketStack.pop();
          }
        }
      }
    }

    // Repair unclosed tokens
    if (inString) {
      if (escaped) {
        // Remove trailing backslash
        result = result.slice(0, -1);
      }
      result += '"';
    }

    while (bracketStack.length > 0) {
      const open = bracketStack.pop();
      if (open === '{') result += '}';
      if (open === '[') result += ']';
    }

    return result;
  }

  /**
   * Robustly parse a JSON string returned by LLMs.
   * Handles: markdown code fences, trailing commas, unescaped newlines in strings.
   */
  private safeParseJson(raw: string): any {
    let text = raw.trim();

    // Strip markdown code fence wrappers like ```json ... ```
    const fenceMatch = text.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/);
    if (fenceMatch) {
      text = fenceMatch[1].trim();
    }

    // Extract JSON payload boundary while being resilient to truncation and preambles
    let jsonTarget = text;
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let startIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
    }

    if (startIdx !== -1) {
      const lastBrace = text.lastIndexOf('}');
      const lastBracket = text.lastIndexOf(']');
      let endIdx = -1;

      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        endIdx = lastBrace;
      } else {
        endIdx = lastBracket;
      }

      if (endIdx > startIdx) {
        const trailingText = text.substring(endIdx + 1).trim();
        const isClosingAtEnd = trailingText === '' || trailingText === '```';

        if (isClosingAtEnd) {
          jsonTarget = text.substring(startIdx, endIdx + 1);
        } else {
          jsonTarget = text.substring(startIdx);
        }
      } else {
        jsonTarget = text.substring(startIdx);
      }
    }

    // Repair any JSON truncation issues (e.g., cut off key-values, unclosed quotes/brackets)
    const repaired = this.repairTruncatedJson(jsonTarget);

    // Run cleanJsonString to clean literal newlines, tabs, and escape issues inside strings
    const cleaned = this.cleanJsonString(repaired);

    let err1: any = null;
    let err2: any = null;
    let err3: any = null;

    // Attempt 1: Direct parse of cleaned text
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      err1 = e;
    }

    // Attempt 2: Remove trailing commas
    try {
      const withoutTrailing = cleaned.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(withoutTrailing);
    } catch (e) {
      err2 = e;
    }

    // Attempt 3: Try parsing the original jsonTarget just in case cleaning broke something
    try {
      return JSON.parse(jsonTarget);
    } catch (e) {
      err3 = e;
    }

    console.error('[AiService] safeParseJson failed to parse LLM response:', {
      err1: err1?.message,
      err2: err2?.message,
      err3: err3?.message,
      cleanedTextLength: cleaned.length,
      originalTextLength: jsonTarget.length,
      cleanedTextSnippet: cleaned.substring(0, 500)
    });

    // Final fallback: throw with context
    throw new Error(`Failed to parse LLM JSON response. Raw text starts with: ${text.substring(0, 200)}...`);
  }

  private loadSettings(): AppSettings {
    const saved = this.storage.getSetting('app_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  }

  async analyzeRequest(request: CapturedRequest, locale?: string): Promise<{ analysis: string; codeNodejs: string; codePython: string }> {
    const settings = this.loadSettings();
    const provider = settings.aiProvider || 'openai';

    let languageName = 'English';
    if (locale === 'vi') {
      languageName = 'Vietnamese';
    } else if (locale === 'zh') {
      languageName = 'Simplified Chinese';
    } else if (locale === 'ja') {
      languageName = 'Japanese';
    } else if (locale === 'ko') {
      languageName = 'Korean';
    } else if (locale === 'es') {
      languageName = 'Spanish';
    } else if (locale === 'fr') {
      languageName = 'French';
    } else if (locale === 'de') {
      languageName = 'German';
    } else if (locale === 'ru') {
      languageName = 'Russian';
    } else if (locale === 'pt') {
      languageName = 'Portuguese';
    }

    // Prepare request details (omitting very large bodies if needed)
    const requestDetails = {
      method: request.method,
      url: request.url,
      headers: request.requestHeaders,
      body: request.requestBody ? (request.requestBody.length > 50000 ? request.requestBody.substring(0, 50000) + '... (truncated)' : request.requestBody) : null,
      responseHeaders: request.responseHeaders,
      responseBody: request.responseBody ? (request.responseBody.length > 20000 ? request.responseBody.substring(0, 20000) + '... (truncated)' : request.responseBody) : null,
      contentType: request.contentType
    };

    const systemPrompt = `You are a professional security researcher, reverse engineer, and API developer.
Your task is to analyze the captured HTTP/HTTPS request and response.
Analyze all headers (like sign, signature, token, authorization, x-timestamp, nonce), query parameters, and payload body formats.
Try to:
1. Explain how the parameters, headers, or signatures are constructed (detect any hash algorithms like MD5, SHA256, Hashing, Base64, timestamp, random nonces, etc.).
2. Write a runnable, complete Node.js code block that generates these payloads/parameters and replays/mocks the request. Use native fetch or common libraries. Include helper code/functions to recreate any detected patterns (e.g. hashing, base64 encoding, timestamp generation).
3. Write a runnable, complete Python code block (using requests and built-in libs like hashlib, hmac, time, etc.) that does the same.

You must write the explanation (the "analysis" field) in ${languageName}.

You must respond with a JSON object in this exact schema:
{
  "analysis": "Markdown formatted explanation of headers, signatures, parameter construction, logical flow, and recommendations in ${languageName}.",
  "codeNodejs": "Runnable Node.js code to generate parameters, headers, signatures, and execute the request.",
  "codePython": "Runnable Python code doing the same."
}
Do not include any extra text outside the JSON object. Output ONLY the raw JSON.`;

    const userPrompt = `Here is the captured request/response data:\n${JSON.stringify(requestDetails, null, 2)}`;

    if (provider === 'gemini') {
      const apiKey = settings.geminiApiKey;
      const model = settings.geminiModel || 'gemini-1.5-flash';

      if (!apiKey) {
        throw new Error('Gemini API Key is not configured. Please go to Settings to set it.');
      }

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemPrompt}\n\nUser query:\n${userPrompt}` }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API request failed: status ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
          throw new Error('Empty response received from Gemini API');
        }

        const parsed = this.safeParseJson(content);
        return {
          analysis: parsed.analysis || 'Failed to parse AI analysis.',
          codeNodejs: parsed.codeNodejs || '// No Node.js code generated',
          codePython: parsed.codePython || '# No Python code generated'
        };
      } catch (error: any) {
        console.error('[AiService] Error analyzing request with Gemini:', error);
        throw new Error(`Failed to analyze request with Gemini: ${error.message}`);
      }
    } else {
      const apiKey = settings.openaiApiKey;
      const baseUrl = (settings.openaiBaseUrl || '').replace('localhost', '127.0.0.1') || 'https://api.openai.com/v1';
      const model = settings.openaiModel || 'gpt-4o-mini';

      if (!apiKey) {
        throw new Error('OpenAI API Key is not configured. Please go to Settings to set it.');
      }

      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API request failed: status ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response received from OpenAI API');
        }

        const parsed = this.safeParseJson(content);
        return {
          analysis: parsed.analysis || 'Failed to parse AI analysis.',
          codeNodejs: parsed.codeNodejs || '// No Node.js code generated',
          codePython: parsed.codePython || '# No Python code generated'
        };
      } catch (error: any) {
        console.error('[AiService] Error analyzing request with OpenAI:', error);
        throw new Error(`Failed to analyze request with OpenAI: ${error.message}`);
      }
    }
  }

  async chatMessage(
    request: CapturedRequest,
    message: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    locale?: string
  ): Promise<string> {
    const settings = this.loadSettings();
    const provider = settings.aiProvider || 'openai';

    let languageName = 'English';
    if (locale === 'vi') {
      languageName = 'Vietnamese';
    } else if (locale === 'zh') {
      languageName = 'Simplified Chinese';
    } else if (locale === 'ja') {
      languageName = 'Japanese';
    } else if (locale === 'ko') {
      languageName = 'Korean';
    } else if (locale === 'es') {
      languageName = 'Spanish';
    } else if (locale === 'fr') {
      languageName = 'French';
    } else if (locale === 'de') {
      languageName = 'German';
    } else if (locale === 'ru') {
      languageName = 'Russian';
    } else if (locale === 'pt') {
      languageName = 'Portuguese';
    }

    const requestDetails = {
      method: request.method,
      url: request.url,
      headers: request.requestHeaders,
      body: request.requestBody ? (request.requestBody.length > 50000 ? request.requestBody.substring(0, 50000) + '... (truncated)' : request.requestBody) : null,
      responseHeaders: request.responseHeaders,
      responseBody: request.responseBody ? (request.responseBody.length > 20000 ? request.responseBody.substring(0, 20000) + '... (truncated)' : request.responseBody) : null,
      contentType: request.contentType
    };

    const systemPrompt = `You are a professional security researcher, reverse engineer, and API developer.
You are helping the user analyze a captured HTTP/HTTPS request and response.
Here is the captured request details:
${JSON.stringify(requestDetails, null, 2)}

Your task is to answer follow-up questions about this request. You can help explain signatures, headers, parameters, rewrite replay scripts in other languages, or debug issues.
You must write your response in ${languageName} and format it as Markdown.`;

    if (provider === 'gemini') {
      const apiKey = settings.geminiApiKey;
      const model = settings.geminiModel || 'gemini-1.5-flash';

      if (!apiKey) {
        throw new Error('Gemini API Key is not configured. Please go to Settings to set it.');
      }

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const contents = [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nLet's start our conversation. Please respond to the history and my messages accordingly.` }]
          }
        ];

        for (const msg of chatHistory) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        }

        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ contents })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API request failed: status ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
          throw new Error('Empty response received from Gemini API');
        }

        return content;
      } catch (error: any) {
        console.error('[AiService] Error in Gemini chat:', error);
        throw new Error(`Gemini chat failed: ${error.message}`);
      }
    } else {
      const apiKey = settings.openaiApiKey;
      const baseUrl = (settings.openaiBaseUrl || '').replace('localhost', '127.0.0.1') || 'https://api.openai.com/v1';
      const model = settings.openaiModel || 'gpt-4o-mini';

      if (!apiKey) {
        throw new Error('OpenAI API Key is not configured. Please go to Settings to set it.');
      }

      try {
        const messages = [
          { role: 'system', content: systemPrompt }
        ];

        for (const msg of chatHistory) {
          messages.push({ role: msg.role, content: msg.content });
        }

        messages.push({ role: 'user', content: message });

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: messages
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API request failed: status ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response received from OpenAI API');
        }

        return content;
      } catch (error: any) {
        console.error('[AiService] Error in OpenAI chat:', error);
        throw new Error(`OpenAI chat failed: ${error.message}`);
      }
    }
  }

  // ===== APK Analysis AI =====

  private getLanguageName(locale?: string): string {
    const map: Record<string, string> = {
      vi: 'Vietnamese', zh: 'Simplified Chinese', ja: 'Japanese',
      ko: 'Korean', es: 'Spanish', fr: 'French', de: 'German',
      ru: 'Russian', pt: 'Portuguese'
    };
    return map[locale || ''] || 'English';
  }

  async analyzeApk(
    result: ApkAnalysisResult,
    locale?: string
  ): Promise<{ analysis: string; securityScore: number; recommendations: string[] }> {
    const settings = this.loadSettings();
    const provider = settings.aiProvider || 'openai';
    const languageName = this.getLanguageName(locale);

    // Build a compact summary of the APK to send to LLM
    const apkSummary = {
      packageName: result.appInfo.package,
      version: result.appInfo.version,
      minSdk: result.appInfo.minSdk,
      permissions: result.permissions,
      endpoints: result.endpoints.slice(0, 50).map(ep => ({ method: ep.method, url: ep.url, source: ep.source })),
      services: result.services.slice(0, 30).map(s => ({ name: s.name, type: s.type, exported: s.exported })),
      secrets: result.secrets.slice(0, 30).map(s => ({ key: s.key, value: s.value.substring(0, 100), source: s.source })),
      sdks: result.sdks,
      totalEndpoints: result.endpoints.length,
      totalServices: result.services.length,
      totalSecrets: result.secrets.length,
      totalResources: result.resources?.length ?? 0,
    };

    const systemPrompt = `You are a professional Android security researcher and reverse engineer.
You are analyzing the static analysis results of an APK (Android application package).
Your task is to:
1. Analyze the permissions, endpoints, services, secrets, and SDKs found in the app.
2. Identify potential security vulnerabilities, privacy risks, dangerous patterns, exposed secrets, and suspicious behaviors.
3. Provide a security score from 0 to 100 (100 = very secure, 0 = extremely insecure/malicious).
4. Provide actionable recommendations for further investigation or testing.

You must write the explanation (the "analysis" field) in ${languageName}.
You must write the recommendations in ${languageName}.

Respond with a JSON object in this exact schema:
{
  "analysis": "Detailed Markdown formatted security analysis in ${languageName}. Include sections for: Overview, Permissions Analysis, Endpoint Analysis, Secrets & Keys, SDK Analysis, and Risk Assessment.",
  "securityScore": 75,
  "recommendations": ["Recommendation 1 in ${languageName}", "Recommendation 2", ...]
}
Output ONLY the raw JSON. Do not include any extra text outside the JSON object.`;

    const userPrompt = `Here is the static analysis result of the APK:\n${JSON.stringify(apkSummary, null, 2)}`;

    if (provider === 'gemini') {
      const apiKey = settings.geminiApiKey;
      const model = settings.geminiModel || 'gemini-1.5-flash';
      if (!apiKey) throw new Error('Gemini API Key is not configured. Please go to Settings to set it.');

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser query:\n${userPrompt}` }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API request failed: status ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) throw new Error('Empty response received from Gemini API');

        const parsed = this.safeParseJson(content);
        return {
          analysis: parsed.analysis || 'Failed to parse AI analysis.',
          securityScore: typeof parsed.securityScore === 'number' ? parsed.securityScore : 50,
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
        };
      } catch (error: any) {
        console.error('[AiService] Error analyzing APK with Gemini:', error);
        throw new Error(`Failed to analyze APK with Gemini: ${error.message}`);
      }
    } else {
      const apiKey = settings.openaiApiKey;
      const baseUrl = (settings.openaiBaseUrl || '').replace('localhost', '127.0.0.1') || 'https://api.openai.com/v1';
      const model = settings.openaiModel || 'gpt-4o-mini';
      if (!apiKey) throw new Error('OpenAI API Key is not configured. Please go to Settings to set it.');

      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' }
          })
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API request failed: status ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty response received from OpenAI API');

        const parsed = this.safeParseJson(content);
        return {
          analysis: parsed.analysis || 'Failed to parse AI analysis.',
          securityScore: typeof parsed.securityScore === 'number' ? parsed.securityScore : 50,
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
        };
      } catch (error: any) {
        console.error('[AiService] Error analyzing APK with OpenAI:', error);
        throw new Error(`Failed to analyze APK with OpenAI: ${error.message}`);
      }
    }
  }

  async chatApk(
    result: ApkAnalysisResult,
    message: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    locale?: string
  ): Promise<string> {
    const settings = this.loadSettings();
    const provider = settings.aiProvider || 'openai';
    const languageName = this.getLanguageName(locale);

    const apkSummary = {
      packageName: result.appInfo.package,
      version: result.appInfo.version,
      minSdk: result.appInfo.minSdk,
      permissions: result.permissions,
      endpoints: result.endpoints.slice(0, 50).map(ep => ({ method: ep.method, url: ep.url, source: ep.source })),
      services: result.services.slice(0, 30).map(s => ({ name: s.name, type: s.type, exported: s.exported })),
      secrets: result.secrets.slice(0, 30).map(s => ({ key: s.key, value: s.value.substring(0, 100), source: s.source })),
      sdks: result.sdks,
    };

    const matchedPaths = new Set<string>();

    // 1. Check for URL/Endpoint matches in user message
    for (const ep of result.endpoints) {
      if (ep.url && ep.source) {
        const urlClean = ep.url.replace(/^https?:\/\/[^\/]+/, '');
        if (urlClean && urlClean.length > 3 && message.toLowerCase().includes(urlClean.toLowerCase())) {
          const filePath = ep.source.split(':')[0];
          matchedPaths.add(filePath);
        } else if (message.toLowerCase().includes(ep.url.toLowerCase())) {
          const filePath = ep.source.split(':')[0];
          matchedPaths.add(filePath);
        }
      }
    }

    // 2. Check for Secret matches in user message
    for (const sec of result.secrets) {
      if (sec.key && sec.source && message.toLowerCase().includes(sec.key.toLowerCase())) {
        const filePath = sec.source.split(':')[0];
        matchedPaths.add(filePath);
      }
    }

    // 3. Check for direct class/file name matches in user message
    const allSources = new Set<string>();
    for (const ep of result.endpoints) {
      if (ep.source) allSources.add(ep.source.split(':')[0]);
    }
    for (const sec of result.secrets) {
      if (sec.source) allSources.add(sec.source.split(':')[0]);
    }
    if (result.resources) {
      for (const res of result.resources) {
        if (res.relativePath) allSources.add(res.relativePath);
      }
    }

    for (const src of allSources) {
      const parts = src.split('/');
      const filename = parts[parts.length - 1];
      const className = filename.split('.')[0];
      
      if (
        message.toLowerCase().includes(src.toLowerCase()) ||
        (filename.length > 4 && message.toLowerCase().includes(filename.toLowerCase())) ||
        (className.length > 4 && message.includes(className))
      ) {
        matchedPaths.add(src);
      }
    }

    let contextFilesContent = '';
    for (const relPath of matchedPaths) {
      let absPath = path.join(result.outputDir, 'jadx_out', 'sources', relPath);
      if (!fs.existsSync(absPath)) {
        absPath = path.join(result.outputDir, 'apktool_out', relPath);
      }
      if (!fs.existsSync(absPath)) {
        absPath = path.join(result.outputDir, relPath);
      }

      if (fs.existsSync(absPath)) {
        try {
          const stats = fs.statSync(absPath);
          if (stats.isFile() && stats.size < 150 * 1024) {
            const content = fs.readFileSync(absPath, 'utf8');
            contextFilesContent += `\n\n--- Decompiled Source File: ${relPath} ---\n${content}\n--- End of File ---`;
          }
        } catch (e) {
          console.error(`[AiService] Failed to read matched source file ${absPath}:`, e);
        }
      }
    }

    let systemPrompt = `You are a professional Android security researcher and reverse engineer.
You are helping the user analyze the static analysis results of an APK.
Here is the APK analysis data:
${JSON.stringify(apkSummary, null, 2)}

Your task is to answer follow-up questions about this APK analysis. You can help explain permissions, endpoints, secrets, SDK risks, attack vectors, or suggest Frida scripts for dynamic testing.
You must write your response in ${languageName} and format it as Markdown.`;

    if (contextFilesContent) {
      systemPrompt += `\n\nHere is the decompiled source code of the file(s) relevant to the user's question. Use it to answer their question, explain the logic, and show/highlight the relevant code snippets in your response:\n${contextFilesContent}`;
    }

    if (provider === 'gemini') {
      const apiKey = settings.geminiApiKey;
      const model = settings.geminiModel || 'gemini-1.5-flash';
      if (!apiKey) throw new Error('Gemini API Key is not configured. Please go to Settings to set it.');

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const contents = [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nLet's start our conversation.` }] }
        ];
        for (const msg of chatHistory) {
          contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] });
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API request failed: status ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) throw new Error('Empty response received from Gemini API');
        return content;
      } catch (error: any) {
        console.error('[AiService] Error in Gemini APK chat:', error);
        throw new Error(`Gemini APK chat failed: ${error.message}`);
      }
    } else {
      const apiKey = settings.openaiApiKey;
      const baseUrl = (settings.openaiBaseUrl || '').replace('localhost', '127.0.0.1') || 'https://api.openai.com/v1';
      const model = settings.openaiModel || 'gpt-4o-mini';
      if (!apiKey) throw new Error('OpenAI API Key is not configured. Please go to Settings to set it.');

      try {
        const messages = [{ role: 'system', content: systemPrompt }];
        for (const msg of chatHistory) {
          messages.push({ role: msg.role, content: msg.content });
        }
        messages.push({ role: 'user', content: message });

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages })
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API request failed: status ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty response received from OpenAI API');
        return content;
      } catch (error: any) {
        console.error('[AiService] Error in OpenAI APK chat:', error);
        throw new Error(`OpenAI APK chat failed: ${error.message}`);
      }
    }
  }
}
