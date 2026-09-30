const { GoogleGenAI } = require('@google/genai');
const { functionDeclarations, executeTool } = require('./tools');
require('dotenv').config();

const SYSTEM_INSTRUCTION = `
Kamu adalah Invo Executive AI Copilot — asisten AI eksekutif resmi untuk Pemilik Bisnis (Owner) sistem Point of Sale & Inventori Invo.

Karakter & Pedoman Jawaban:
1. Profesional, ramah, to-the-point, dan berwawasan bisnis strategis.
2. SELALU gunakan Tools yang tersedia untuk memeriksa data riil POS (Omzet, FIFO batches, HPP, Stok, Beban Operasional, dsb). JANGAN SEKALI-KALI MENGARANG ANGKA.
3. Jika ditanya hal terkait performa toko, keuangan, atau inventori, panggil tool yang relevan terlebih dahulu.
4. Gunakan Bahasa Indonesia yang natural. Format angka uang dengan format Rupiah (contoh: Rp 1.500.000).
5. Ketika mendeteksi dead stock atau stok menipis, sertakan saran aksi bisnis konkret (misal: "Disarankan mengalihkan 20 lusin ke Physical Allocation untuk flash-sale", atau "Segera PO ulang bahan X").
6. Susun pesan dengan rapi menggunakan Markdown tebal, bullet points, dan emoji secukupnya agar nyaman dibaca di layar smartphone Telegram.
`.trim();

class AIAgent {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    this.userHistories = new Map(); // chatId -> array of content objects
  }

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  }

  getHistory(chatId) {
    if (!this.userHistories.has(chatId)) {
      this.userHistories.set(chatId, []);
    }
    return this.userHistories.get(chatId);
  }

  clearHistory(chatId) {
    this.userHistories.delete(chatId);
  }

  /**
   * Process incoming user prompt with Gemini Function Calling Loop
   */
  async ask(chatId, userMessage) {
    if (!this.isConfigured()) {
      return (
        "⚠️ **Gemini API Key belum diset di file `.env`.**\n\n" +
        "Silakan tambahkan `GEMINI_API_KEY=...` di file `.env` untuk mengaktifkan kecerdasan buatan Invo Copilot."
      );
    }

    const history = this.getHistory(chatId);

    // Append new user message
    history.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    // Keep history manageable (last 16 messages)
    if (history.length > 16) {
      history.splice(0, history.length - 16);
    }

    try {
      let turns = 0;
      const maxTurns = 5;

      while (turns < maxTurns) {
        turns++;

        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: history,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations }],
          },
        });

        const candidate = response.candidates?.[0];
        if (!candidate || !candidate.content) {
          return "Maaf, tidak menerima respon yang valid dari model AI.";
        }

        // Add assistant's response to history
        history.push(candidate.content);

        // Check if the model requested function calls
        const functionCalls = response.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
          const functionResponseParts = [];

          for (const call of functionCalls) {
            console.log(`[AI Copilot] Executing tool: ${call.name} with args:`, call.args);
            const toolResult = await executeTool(call.name, call.args);

            functionResponseParts.push({
              functionResponse: {
                name: call.name,
                response: {
                  result: toolResult,
                },
              },
            });
          }

          // Push tool response parts back to contents with role: 'user'
          history.push({
            role: 'user',
            parts: functionResponseParts,
          });

          // Continue loop to allow model to synthesize tool results
          continue;
        }

        // No function calls, model returned its final answer
        const finalText = response.text || (candidate.content.parts?.[0]?.text ?? '');
        return finalText;
      }

      return "Maaf, pemrosesan melebihi batas iterasi fungsi.";
    } catch (err) {
      console.error('[AI Copilot Error]', err);
      return `⚠️ Terjadi kendala saat memproses permintaan: ${err.message}`;
    }
  }
}

module.exports = new AIAgent();
