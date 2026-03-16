import Constants from "expo-constants";

const API_KEY = Constants.expoConfig?.extra?.openaiApiKey ?? "";
const API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface StreamOptions {
  messages: ChatMessage[];
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function streamChatCompletion({
  messages,
  onToken,
  onDone,
  onError,
}: StreamOptions): Promise<void> {
  if (!API_KEY || API_KEY === "your-api-key-here") {
    onError(new Error("Please add your OpenAI API key to .env"));
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
        max_tokens: 512,
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      onToken(content);
    }

    onDone();
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
