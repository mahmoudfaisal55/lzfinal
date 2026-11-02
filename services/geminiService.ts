import { RIASECScores } from "../types";

// Function to get career guidance via server-side Gemini API based on user's RIASEC scores.
export const getCareerGuidance = async (scores: RIASECScores, userInput: string): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/guidance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scores, userInput }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (data && typeof data.text === "string") {
        return data.text;
      }
      return "حدث خطأ أثناء التواصل مع المستشار الذكي. يرجى المحاولة لاحقاً.";
    }

    return data?.text || "عذراً، لم أستطع تحليل السؤال حالياً.";
  } catch (error) {
    console.error("Career Guidance API Error:", error);
    return "حدث خطأ أثناء التواصل مع المستشار الذكي. يرجى المحاولة لاحقاً.";
  }
};

export const getInitialAnalysis = async (scores: RIASECScores): Promise<string> => {
  try {
    const response = await fetch("/api/gemini/initial-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scores }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (data && typeof data.text === "string") {
        return data.text;
      }
      return "أنت تمتلك بصمة مهنية فريدة تجمع بين مهارات متميزة. استكشف نتائجك وتحدث مع المستشار الذكي.";
    }

    return data?.text || "تحليل رائع بانتظارك! ابدأ الحوار مع المستشار لمعرفة المزيد.";
  } catch (error) {
    console.error("Initial Analysis API Error:", error);
    return "أنت تمتلك بصمة مهنية فريدة تجمع بين مهارات متميزة. استكشف نتائجك وتحدث مع المستشار الذكي.";
  }
};

