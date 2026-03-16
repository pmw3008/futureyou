import Constants from "expo-constants";
import type { EvidenceEntry, UserProfile } from "../types";
import { DEFAULT_PROFILE } from "../types";

const API_KEY = Constants.expoConfig?.extra?.openaiApiKey ?? "";
const API_URL = "https://api.openai.com/v1/chat/completions";

export async function generateAffirmationFromEvidence(
  entry: EvidenceEntry,
  profile: UserProfile = DEFAULT_PROFILE
): Promise<string> {
  if (!API_KEY || API_KEY === "your-api-key-here") {
    throw new Error("Please add your OpenAI API key to .env");
  }

  const systemPrompt = `You generate powerful, first-person identity affirmations from real evidence of personal growth.

The user's identity statement: "${profile.identityStatement}"
${profile.nonNegotiable ? `What they refuse to accept: "${profile.nonNegotiable}"` : ""}
${profile.successFeeling ? `What success feels like to them: "${profile.successFeeling}"` : ""}

RULES:
- Output ONLY the affirmation — no quotes, no explanation, no preamble
- First person, present tense ("I am...", "I attract...", "I create...")
- 8-15 words maximum
- Make it specific to the evidence, not generic
- It should feel like an identity truth, not a wish
- Match the energy of "${profile.vibe}"

EXAMPLES:
Evidence: "Signed my first $10k client" → I attract high-value clients who trust my work.
Evidence: "Woke up at 5AM for 7 days straight" → I am someone who rises before the world.
Evidence: "Said no to a toxic friendship" → I protect my energy without hesitation.`;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Evidence type: ${entry.type}\nTitle: ${entry.title}\nDetails: ${entry.body}`,
        },
      ],
      max_tokens: 60,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("No affirmation generated");
  }

  // Strip any surrounding quotes the model might add
  return content.replace(/^["']|["']$/g, "").trim();
}
