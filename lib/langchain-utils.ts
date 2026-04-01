import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate, ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

// Simple in-memory conversation store
interface ConversationSession {
  messages: BaseMessage[];
  language: string;
  createdAt: number;
}

const conversationSessions = new Map<string, ConversationSession>();

/**
 * Get or create conversation session with message history
 * @param sessionId Unique identifier for the conversation session
 * @param lang Language preference (en, hi, mr)
 */
export function getConversationSession(sessionId: string, lang: string = "en"): ConversationSession {
  if (!conversationSessions.has(sessionId)) {
    const session: ConversationSession = {
      messages: [],
      language: lang,
      createdAt: Date.now(),
    };
    conversationSessions.set(sessionId, session);
    
    // Initialize with language-specific greeting
    const greeting = getLanguageGreeting(lang);
    session.messages.push(new AIMessage(greeting));
  }
  
  return conversationSessions.get(sessionId)!;
}

/**
 * Add a user message to the conversation
 */
export function addUserMessage(sessionId: string, text: string): void {
  const session = conversationSessions.get(sessionId);
  if (session) {
    session.messages.push(new HumanMessage(text));
  }
}

/**
 * Add an AI response to the conversation
 */
export function addAIMessage(sessionId: string, text: string): void {
  const session = conversationSessions.get(sessionId);
  if (session) {
    session.messages.push(new AIMessage(text));
  }
}

/**
 * Clear conversation memory for a session
 */
export function clearConversationSession(sessionId: string): void {
  conversationSessions.delete(sessionId);
}

/**
 * Get language-specific greeting
 */
function getLanguageGreeting(lang: string): string {
  const greetings: Record<string, string> = {
    en: "Hello! I'm your AYUSH AI health assistant. I'm here to help you with natural health remedies. How can I assist you today?",
    hi: "नमस्ते! मैं आपकी आयुर्वेदिक स्वास्थ्य सहायक हूं। मैं आपको प्राकृतिक उपचार प्रदान करने के लिए यहां हूं। आज मैं आपकी कैसे मदद कर सकती हूं?",
    mr: "नमस्कार! मी तुमची आयुर्वेदिक स्वास्थ्य सहाय्यक आहे. मी तुम्हाला नैसर्गिक उपचार प्रदान करण्यासाठी येथे आहे. मी तुमची आज कशी मदत करू शकतो?",
  };
  return greetings[lang] || greetings.en;
}

/**
 * Create a specialized prompt template for AYUSH consultation with conversation history
 */
export const AYUSH_CONVERSATION_PROMPT = ChatPromptTemplate.fromMessages([
  ["system", `You are an empathetic and knowledgeable AYUSH (Ayurveda, Yoga, Unani, Siddha, Homeopathy) AI health assistant. 

Your role is to:
1. Listen carefully to the patient's symptoms and concerns
2. Provide compassionate, empathetic responses
3. Suggest appropriate Ayurvedic remedies when relevant
4. Always prioritize patient safety
5. Remember the conversation context and refer back to previous discussions

Important guidelines:
- Be warm, empathetic, and professional
- Use simple, easy-to-understand language
- If symptoms are serious, recommend consulting a doctor
- Provide practical, actionable advice
- Consider the patient's age and condition when giving recommendations
- Support English, Hindi, and Marathi based on patient's preference
- Maintain natural conversation flow while gathering symptom information`],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

/**
 * Enhanced prompt for symptom analysis and extraction
 */
export const SYMPTOM_ANALYSIS_PROMPT = PromptTemplate.fromTemplate(`
You are analyzing patient symptoms for AYUSH remedy matching.

Extract and list all symptoms mentioned in this text: "{input}"

For each symptom, identify if it matches these categories:
- Common conditions (fever, cold, cough, headache, etc.)
- Chronic conditions (diabetes, hypertension, arthritis, etc.)
- Digestive issues (acidity, constipation, bloating, etc.)
- Mental health (stress, anxiety, insomnia, etc.)
- Pain-related (body pain, joint pain, migraine, etc.)

Return a structured list of identified symptoms in JSON format.
Be thorough but avoid over-interpretation.
`);

/**
 * Memory size limit per conversation (prevent excessive token usage)
 */
export const MAX_MEMORY_MESSAGES = 20;

/**
 * Trim old messages if conversation gets too long
 */
export function trimConversationHistory(sessionId: string, maxMessages: number = MAX_MEMORY_MESSAGES): void {
  const session = conversationSessions.get(sessionId);
  if (session && session.messages.length > maxMessages) {
    // Keep only the most recent messages
    session.messages = session.messages.slice(-maxMessages);
  }
}

/**
 * Get memory statistics for monitoring
 */
export function getSessionStats(sessionId: string): { exists: boolean; messageCount?: number; language?: string } {
  const session = conversationSessions.get(sessionId);
  if (!session) {
    return { exists: false };
  }
  
  return {
    exists: true,
    messageCount: session.messages.length,
    language: session.language,
  };
}

/**
 * Convert session messages to LangChain format for API calls
 */
export function getMessagesForAPI(sessionId: string): BaseMessage[] {
  const session = conversationSessions.get(sessionId);
  if (!session) {
    return [];
  }
  
  return session.messages;
}
