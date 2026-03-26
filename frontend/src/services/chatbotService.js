import { apiClient, buildQueryString } from './apiClient';
import { getSessionId } from '../utils/session';
import { trackChatbotQuery } from './analyticsService';

export const chatbotService = {
  getSessionHistory: () =>
    apiClient(`/chatbot/session${buildQueryString({ session_id: getSessionId() })}`),

  sendMessage: (message) => {
    trackChatbotQuery(message);

    return apiClient('/chatbot', {
      method: 'POST',
      body: JSON.stringify({
        session_id: getSessionId(),
        message
      })
    });
  }
};