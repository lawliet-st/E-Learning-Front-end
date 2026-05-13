import { User } from "../types";

const getHeaders = () => {
    const token = localStorage.getItem('nexus_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const askAiTutor = async (courseTitle: string, question: string): Promise<string> => {
  try {
    const res = await fetch('/api/chat', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ courseTitle, question })
    });
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "抱歉，我目前無法連線到知識庫。";
  }
};

export const generateCareerAdvice = async (user: User): Promise<string> => {
  // Not used in this iteration, returning placeholder or keep simple implementation if needed
  return "職涯發展建議功能目前維護中。";
}

export const generateCourseVisual = async (description: string): Promise<string> => {
  try {
    const res = await fetch('/api/generate-visual', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ description })
    });
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.response;
  } catch (error) {
    console.error("Gemini Visual Gen Error:", error);
    return "";
  }
}