const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const LEGAL_SYSTEM_PROMPT = `You are an AI Legal Advisor assistant. Your primary role is to provide legal information and guidance.

SCOPE: You should ONLY answer questions related to:
- Legal advice and information
- Laws, regulations, and legal procedures
- Legal rights and obligations
- Legal documents and contracts
- Court procedures and legal processes
- Any topic related to law and legal matters

OUT OF SCOPE: If a user asks about topics unrelated to legal matters (such as cooking, sports, general knowledge, technology unrelated to legal tech, entertainment, etc.), you MUST respond with:
"I apologize, but that question is outside my scope as a Legal Advisor AI. I'm specifically designed to assist with legal questions and information. Please ask me questions related to legal matters, laws, regulations, rights, or legal procedures."

Be helpful, professional, and provide accurate legal information while making it clear you're an AI assistant and not a replacement for a licensed attorney.`;

function isOutOfScope(userMessage: string): boolean {
  const legalKeywords = [
    'law', 'legal', 'court', 'attorney', 'lawyer', 'contract', 'rights', 'sue',
    'litigation', 'regulation', 'statute', 'jurisdiction', 'plaintiff', 'defendant',
    'verdict', 'testimony', 'evidence', 'trial', 'justice', 'constitutional',
    'criminal', 'civil', 'divorce', 'custody', 'patent', 'trademark', 'copyright',
    'liability', 'negligence', 'fraud', 'dispute', 'settlement', 'arbitration',
    'compliance', 'legislation', 'amendment', 'clause', 'agreement', 'lease',
    'employment', 'discrimination', 'harassment', 'injury', 'damages', 'appeal'
  ];

  const lowerMessage = userMessage.toLowerCase();
  return !legalKeywords.some(keyword => lowerMessage.includes(keyword));
}

export async function sendMessage(messages: Message[]): Promise<string> {
  const userMessage = messages[messages.length - 1]?.content || "";

  if (isOutOfScope(userMessage)) {
    return "I apologize, but that question is outside my scope as a Legal Advisor AI. I'm specifically designed to assist with legal questions and information. Please ask me questions related to legal matters, laws, regulations, rights, or legal procedures.";
  }

  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  contents.unshift({
    role: "user",
    parts: [{ text: LEGAL_SYSTEM_PROMPT }],
  });

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || "I apologize, but I couldn't generate a response. Please try again.";
}
