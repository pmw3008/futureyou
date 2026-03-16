/**
 * AI Identity Script Generator
 *
 * Generates deeply personal morning and night identity audio scripts
 * based on the user's profile, vibe, and identity statement.
 *
 * Uses present-tense identity language only:
 *   I am, I choose, I move, I receive, I live, I release
 *
 * Never uses future-based language:
 *   "in six months", "future you says", "one day", "you will become"
 */

import Constants from "expo-constants";
import type { UserProfile } from "../types";

const API_KEY = Constants.expoConfig?.extra?.openaiApiKey ?? "";
const API_URL = "https://api.openai.com/v1/chat/completions";

export type ScriptType = "morning" | "night";

const MORNING_SYSTEM_PROMPT = `You write deeply intimate, hyper-personal morning identity audio scripts. Every sentence must feel like it was written by someone who has lived inside this person's mind.

CRITICAL PERSONALIZATION RULES:
- Use the person's ACTUAL NAME repeatedly throughout — not "you" every time. Alternate between their name and "you" for intimacy. Say their name at least 4-5 times.
- EXTRACT specific details from their identity statement and dream life. If they say "I am a disciplined creator" — reference the discipline, the creation, the specific type of work.
- If they describe their dream life, BUILD VIVID SCENES FROM IT. Don't summarize — place them INSIDE specific moments. What room are they in? What does the light look like? What are they wearing? What sounds are around them?
- Reference their career/vibe if provided. A tennis player's script sounds NOTHING like an entrepreneur's.
- NEVER write anything that could apply to any random person. Every line must be traceable to something specific about THIS person.
- Weave their EXACT WORDS from their identity statement back to them naturally — they should hear their own language reflected back.

STRICT LANGUAGE RULES:
- Use ONLY present-tense identity language: "I am", "I choose", "I move", "I receive"
- NEVER use future-based language: "one day", "you will become", "soon", "eventually"
- The person IS already this identity — they are living it RIGHT NOW

FORMAT:
- Write 6 to 9 short paragraphs, each 2-3 sentences
- Spoken aloud at a calm, deliberate pace = 3-5 minutes
- NEVER start with "Close your eyes" or "Take a breath" — that is generic and lazy
- First sentence must be so specific that only THIS person could hear it and feel seen
- Build through sensory identity anchoring — textures, sounds, temperatures, physical sensations in their specific environment
- End with a visceral activation: they should feel it in their chest

TONE:
- Like someone who knows them deeply speaking directly into their ear
- Cinematic intimacy — not motivational poster energy
- Specific, grounded, physical — not abstract or philosophical
- This script should make them emotional because of how SEEN they feel
- Conversational flow — use commas and dashes for natural speech rhythm, not short choppy sentences`;

const NIGHT_SYSTEM_PROMPT = `You write deeply intimate nighttime identity regulation scripts for sleep conditioning. This should feel like the most personal, tender thing anyone has ever said to this person.

CRITICAL PERSONALIZATION RULES:
- Use their NAME gently, repeatedly — like someone who loves them whispering it. Say their name at least 5-6 times across the script.
- Reference SPECIFIC parts of their identity and dream life — not as a summary, but as gentle scenes they sink into as they fall asleep.
- If they described their dream life, paint quiet evening moments FROM that life. Not the hustle — the stillness after. The view from their window. The quality of silence in their space.
- Reference their career/energy/vibe to make the release feel specific. "You put down the work that only YOU can do" is more personal than "you release the day."
- Every paragraph should contain at least one detail that could ONLY apply to this specific person.

STRICT LANGUAGE RULES:
- Use ONLY present-tense identity language: "I am", "I release", "I rest", "I trust", "I am safe"
- NEVER use future-based language
- The person IS already this identity — it deepens in sleep

FORMAT:
- Write 8 to 12 short paragraphs, each 1-3 sentences
- Spoken aloud = 10-15 minutes at a slow, sleep-paced delivery
- NEVER start with generic instructions like "Close your eyes" or "Take a breath"
- Start by dropping them into a specific, sensory scene of rest that references THEIR actual life
- Move through release, forgiveness, and identity anchoring — each tied to their specific world
- End with deep rest: they should feel safe and held, with their identity settling into their bones

TONE:
- Like warm honey — slow, thick, deliberate
- Permission-giving — "${"{name}"}, you are allowed to rest"
- Affirming who they are, not what they did
- No urgency, no activation — pure safety and peace
- Long, flowing sentences that carry them into sleep — use commas to create a gentle, rolling rhythm
- Reference their own words back to them softly`;

function buildUserContext(profile: UserProfile): string {
  const parts: string[] = [];

  if (profile.name) parts.push(`Name: ${profile.name}`);
  if (profile.identityStatement) parts.push(`Their identity statement (their own words): "${profile.identityStatement}"`);
  if (profile.idealDay) parts.push(`Their dream life (their own words): "${profile.idealDay}"`);
  if (profile.career) parts.push(`Career/work: ${profile.career}`);
  if (profile.vibe) parts.push(`Energy/Vibe they embody: ${profile.vibe}`);

  return parts.join("\n");
}

/**
 * Generate a personalized identity audio script.
 *
 * @param type - "morning" for activation, "night" for regulation/sleep
 * @param profile - The user's identity profile
 * @returns The full script text, paragraph-separated
 */
export async function generateIdentityScript(
  type: ScriptType,
  profile: UserProfile
): Promise<string> {
  if (!API_KEY || API_KEY === "your-api-key-here") {
    // Return a high-quality fallback script
    return type === "morning"
      ? getFallbackMorningScript(profile)
      : getFallbackNightScript(profile);
  }

  const systemPrompt =
    type === "morning" ? MORNING_SYSTEM_PROMPT : NIGHT_SYSTEM_PROMPT;
  const userContext = buildUserContext(profile);

  const userMessage =
    type === "morning"
      ? `Write a morning identity audio script for this person:\n\n${userContext}\n\nThis is NOT a generic script. I need you to use their EXACT name throughout. Extract specific imagery from their identity statement and dream life description. Build sensory scenes from THEIR specific world — their workspace, their morning routine, their environment. Reference their own words back to them. Every sentence should feel like it was written after spending a week inside their life. If they mention specific activities, places, or feelings in their dream life — build scenes around those EXACT details. Do NOT start with "Close your eyes" or any generic opener. First line must reference something specific about THEM.`
      : `Write a nighttime identity regulation script for this person:\n\n${userContext}\n\nThis plays as they fall asleep. Use their name tenderly throughout. Paint quiet, intimate scenes from THEIR specific dream life — the evening version. Reference the specific work they put down, the specific identity they carry into rest. Use their own language from their identity statement, woven gently into scenes of safety and peace. Build sensory details from THEIR world — not generic beaches or forests unless they specifically mentioned those. Every paragraph must contain something that could only apply to THIS person. Do NOT start with generic instructions. First line should place them in a specific moment of their actual life settling into rest.`;

  try {
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
          { role: "user", content: userMessage },
        ],
        max_tokens: type === "morning" ? 800 : 1200,
        temperature: 0.92,
      }),
    });

    if (!response.ok) {
      console.warn(`[IdentityScript] API error ${response.status}`);
      return type === "morning"
        ? getFallbackMorningScript(profile)
        : getFallbackNightScript(profile);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return type === "morning"
        ? getFallbackMorningScript(profile)
        : getFallbackNightScript(profile);
    }

    return content;
  } catch (err) {
    console.warn("[IdentityScript] Generation error:", err);
    return type === "morning"
      ? getFallbackMorningScript(profile)
      : getFallbackNightScript(profile);
  }
}

// ─── Fallback Scripts ────────────────────────────────────────────

function getFallbackMorningScript(profile: UserProfile): string {
  const name = profile.name || "you";
  const identity = profile.identityStatement || "a powerful, intentional person";
  const dreamLife = profile.idealDay || "a life of clarity, focus, and intention";

  return `The room is still dark, but ${name} is already awake. Not from an alarm — from something deeper. Your body knows what today holds, and it is ready.

${name}, you sit up slowly. Your spine straightens. The air is cool on your skin, and there is a quiet electricity in your chest. You are ${identity}. Not in theory. In practice. In the way you carry yourself through every room you enter.

Picture it clearly — ${dreamLife}. You are already inside this life. The morning light falls across your space exactly how you designed it. Every detail reflects the choices you have made.

There is no rush, ${name}. You move through this morning with the kind of calm that only comes from certainty. You know who you are. You know what you are building. You know exactly where you are going.

Your hands are steady. Your thoughts are clear. The noise of the world has no hold on you today, because you have already decided who you are. You are ${identity}, and that truth does not waver.

${name}, feel it in your chest right now — that deep, unshakable knowing. This is not hope. This is recognition. You are already living as the person you declared yourself to be.

The people who encounter you today will feel it. Not because you announce it, but because it radiates from how you move, how you listen, how you hold silence.

Stand up, ${name}. Step into this day as exactly who you are. Not becoming. Being. Right now.`;
}

function getFallbackNightScript(profile: UserProfile): string {
  const name = profile.name || "you";
  const identity = profile.identityStatement || "someone who deserves deep rest";
  const dreamLife = profile.idealDay || "a life of peace, purpose, and deep fulfillment";

  return `The world outside has gone quiet, ${name}. The sounds of the day are fading — the conversations, the decisions, the motion of everything you carried. Let it all settle now, like dust in still air.

${name}, your body is sinking into this bed, and you are letting it. Feel the weight of your shoulders releasing, feel the tension in your jaw softening, feel the muscles behind your eyes finally letting go. You earned this stillness.

Today, you showed up as ${identity}. Not perfectly — but honestly. And that honesty is more powerful than perfection has ever been. You chose yourself today, ${name}, and that choice echoes into everything.

Let go of anything that was not yours to carry. Words that missed the mark, moments that felt heavy — release them now. They do not define you. They do not follow you into this rest.

${name}, picture the life you are already living — ${dreamLife}. See the evening version of it. The quiet after everything is done. The warm light. The feeling of enough. You are already inside this life.

Your body knows how to restore itself, ${name}. Every cell is working for you right now, rebuilding, recharging, preparing you for tomorrow. You do not need to manage this. Trust it.

You are safe here. The person you are does not disappear in sleep — it deepens. ${name}, you are ${identity}, and this truth settles deeper into your bones with every breath.

There is nothing left to do tonight. Nothing to solve, nothing to fix, nothing to figure out. ${name}, you are allowed to rest completely, without guilt, without reservation.

Feel yourself drifting now, ${name}. The boundary between waking and sleeping is blurring, and you are letting it happen. Your body is warm. Your mind is quiet. Your heart is steady.

${name}, as you fall asleep, know this — you are exactly who you said you are. Tomorrow, you rise as the same person. Rooted. Clear. Whole. But right now, you rest.

Sleep now, ${name}. You are held.`;
}
