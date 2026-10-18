import { apiClient } from './apiClient';
import { Match } from '../types/matching';
import { DEMO_MATCHES } from './demoFixtures';
import { MatchStatus } from '../types/enums';

export const matchingService = {
  async getMatchesForCase(caseId: string): Promise<Match[]> {
    if (apiClient.isDemoMode()) {
      return DEMO_MATCHES;
    }
    return apiClient.get<Match[]>(`/items/${caseId}/matches`);
  },

  async getCandidateMatches(caseId: string): Promise<Match[]> {
    return this.getMatchesForCase(caseId);
  },

  async confirmMatch(id: string): Promise<Match> {
    if (apiClient.isDemoMode()) {
      const match = DEMO_MATCHES.find((m) => m.id === id);
      if (match) {
        match.status = MatchStatus.CONFIRMED;
        return match;
      }
      throw new Error(`Match ${id} not found`);
    }
    return apiClient.post<Match>(`/matches/${id}/confirm`);
  },

  async dismissMatch(id: string): Promise<Match> {
    if (apiClient.isDemoMode()) {
      const match = DEMO_MATCHES.find((m) => m.id === id);
      if (match) {
        match.status = MatchStatus.DISMISSED;
        return match;
      }
      throw new Error(`Match ${id} not found`);
    }
    return apiClient.post<Match>(`/matches/${id}/dismiss`);
  },
};
