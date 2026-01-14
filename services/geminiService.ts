import { GoogleGenAI } from "@google/genai";

const KHMER_FALLBACKS = [
  "អស្ចារ្យណាស់! កូនធ្វើបានល្អណាស់! 🌟",
  "បន្តទៅមុខទៀត! កូនជាកំពូលអ្នកប្រើម៉ៅហើយ! 🐭✨",
  "ពូកែណាស់! មេរៀននេះងាយស្រួលសម្រាប់កូនមែនទេ? 🏆",
  "ធ្វើបានល្អណាស់! តោះទៅវគ្គបន្តទៀត! 🚀",
  "អស្ចារ្យ! កូនពិតជាមានសមត្ថភាពមែន! 💎",
  "កូនពូកែខ្លាំងណាស់! រង្វាន់សម្រាប់កូនគឺមេរៀនបន្ទាប់! 🎁",
  "អាយកូឡា! កូនធ្វើបានល្អឥតខ្ចោះ! 🌈"
];

export const getEncouragingMessage = async (levelName: string): Promise<string> => {
  // Always create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Pick a random fallback immediately to ensure we always have something to show
  const randomFallback = KHMER_FALLBACKS[Math.floor(Math.random() * KHMER_FALLBACKS.length)];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a very short, super encouraging, and funny sentence in Khmer language for a Cambodian child who just successfully finished a lesson called "${levelName}" in an interactive mouse learning game. Mention their progress or that they are getting smarter. Use emojis! Keep it under 12 words. The tone should be very sweet, celebratory, and supportive like a friendly cartoon robot.`,
      config: {
        temperature: 0.9,
      },
    });

    const text = response.text?.trim();
    return text || randomFallback;
  } catch (error: any) {
    console.warn("Gemini API Error or Rate limit. Using fallback message.", error);
    return randomFallback;
  }
};