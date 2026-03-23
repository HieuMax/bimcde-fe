import { useApi as apiClient } from "@/app/hooks/useApi";
import { ChatRequest, ChatResponse } from "@/types/chatbot";

const api = apiClient();
const BASE_URL = "/assistant";

export const chatbotService = {
  sendMessage: async (payload: ChatRequest) => {
    const res = await api.post(`${BASE_URL}/chatbot`, payload);
    return res as ChatResponse;
  }
};