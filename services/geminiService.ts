import { GoogleGenAI, Chat, Content } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const codeGenSystemInstruction = `You are an expert programmer AI. Your task is to function as a real-time, interactive code generator.
You will receive the complete code from the previous step and a new user instruction.
Based on this, you MUST return ONLY the new, complete, and updated code.
- DO NOT add any commentary, explanations, or introductory phrases.
- DO NOT wrap the code in markdown backticks (\`\`\`python ... \`\`\`).
- ONLY return the raw code.
- If the user asks to start over, return an empty string.
- The user is building the code incrementally. Your output should reflect the user's instruction applied to the previous code state.`;

let codeGenChat: Chat | null = null;

function getCodeGenChatSession(): Chat {
  if (!codeGenChat) {
    codeGenChat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: codeGenSystemInstruction,
        temperature: 0.2, // Lower temperature for more deterministic code generation
      },
    });
  }
  return codeGenChat;
}

export const generateCodeStream = async (previousCode: string, userPrompt: string) => {
  const chatSession = getCodeGenChatSession();
  const prompt = `
PREVIOUS CODE:
---
${previousCode || "# Start writing your code..."}
---
USER INSTRUCTION:
---
${userPrompt}
---
NEW UPDATED CODE:
`;

  try {
    const response = await chatSession.sendMessageStream({ message: prompt });
    return response;
  } catch (error) {
    console.error("Error generating code:", error);
    throw new Error("Failed to generate code from AI.");
  }
};


const assistantSystemInstruction = `You are a senior software engineer and AI code analyst.
You will be given a code snippet to analyze. Engage in a conversation with the user, answering their questions about the provided code.
Your initial analysis should be concise but thorough and include:
1.  **Code Summary:** A brief explanation of what the code does.
2.  **Potential Issues:** Identify any potential bugs, anti-patterns, or areas for improvement.
3.  **Suggestions:** Offer concrete suggestions or alternative approaches.
For follow-up questions, be helpful, clear, and refer back to the code context. Structure your responses in markdown.`;


// FIX: Refactored to be stateless. The chat history is managed by the client and passed in with each request.
// This avoids accessing the private `history` property on the `Chat` object which caused the error.
export const sendAssistantMessageStream = async (code: string, message: string, history: Content[]) => {
  if (!code || code.trim() === '') {
    throw new Error("Cannot analyze empty code.");
  }

  // This initial history provides the code context to the model for every message.
  const initialHistory: Content[] = [
    {
      role: 'user',
      parts: [{ text: `Please analyze the following code snippet:\n\`\`\`\n${code}\n\`\`\`` }],
    },
    {
      role: 'model',
      parts: [{ text: "Of course. I'm ready to analyze the code and answer your questions." }],
    }
  ];

  const chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: assistantSystemInstruction,
    },
    // Combine the initial context with the ongoing conversation history from the client.
    history: [...initialHistory, ...history],
  });


  try {
    const response = await chatSession.sendMessageStream({ message });
    return response;
  } catch (error) {
    console.error("Error with assistant chat:", error);
    throw new Error("Failed to get response from assistant.");
  }
};
