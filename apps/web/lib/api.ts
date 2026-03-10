import axios from 'axios';
import { SentimentAnalysisResult } from '@pulse/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';

// Token getter — set by the app after Clerk loads
let _tokenGetter: (() => Promise<string | null>) | null = null;
export function setTokenGetter(fn: () => Promise<string | null>) {
    _tokenGetter = fn;
}

const apiClient = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

// Attach Clerk token automatically on every request
apiClient.interceptors.request.use(async (config) => {
    if (_tokenGetter) {
        const token = await _tokenGetter();
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Types ──────────────────────────────────────────────────────────────────

export interface AnalyzeResponse {
    data: SentimentAnalysisResult & { id: string };
    meta: { fromCache: boolean };
}

export interface AnalysisRow {
    id: string;
    inputText: string;
    charCount: number | null;
    source: string | null;
    createdAt: string;
    score: number | null;
    label: string | null;
    confidence: number | null;
    summary: string | null;
    emotions: Record<string, number> | null;
    keywords: Array<{ word: string; sentiment: number }> | null;
    sentences: Array<{ text: string; sentiment: number }> | null;
}

export interface DashboardStats {
    totalAnalyses: number;
    avgScore: number;
    usageToday: number;
    topEmotion: string;
    recentAnalyses: AnalysisRow[];
    trendData: number[];
}

export interface Project {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    createdAt: string;
}

export interface ApiKey {
    id: string;
    name: string;
    keyPrefix: string;
    callsToday: number | null;
    lastUsed: string | null;
    createdAt: string;
    rawKey?: string; // only present immediately after creation
}

// ── API Methods ────────────────────────────────────────────────────────────

export const pulseApi = {
    // Single text analysis
    analyzeText: async (text: string): Promise<AnalyzeResponse> => {
        const { data } = await apiClient.post<AnalyzeResponse>('/analyze', { text });
        return data;
    },

    // History
    getAnalyses: async (page = 1, limit = 20, projectId?: string) => {
        const params: Record<string, any> = { page, limit };
        if (projectId) params.projectId = projectId;
        const { data } = await apiClient.get('/analyses', { params });
        return data as { data: AnalysisRow[]; meta: { page: number; limit: number; total: number; pages: number } };
    },
    getAnalysis: async (id: string) => {
        const { data } = await apiClient.get(`/analyses/${id}`);
        return data as { data: AnalysisRow };
    },
    deleteAnalysis: async (id: string) => {
        const { data } = await apiClient.delete(`/analyses/${id}`);
        return data;
    },

    // Projects
    getProjects: async () => {
        const { data } = await apiClient.get('/projects');
        return data as { data: Project[] };
    },
    createProject: async (name: string, description?: string) => {
        const { data } = await apiClient.post('/projects', { name, description });
        return data as { data: Project };
    },
    updateProject: async (id: string, fields: Partial<Pick<Project, 'name' | 'description'>>) => {
        const { data } = await apiClient.patch(`/projects/${id}`, fields);
        return data as { data: Project };
    },
    deleteProject: async (id: string) => {
        const { data } = await apiClient.delete(`/projects/${id}`);
        return data;
    },
    getProjectAnalyses: async (id: string, page = 1) => {
        const { data } = await apiClient.get(`/projects/${id}/analyses`, { params: { page } });
        return data as { data: AnalysisRow[] };
    },

    // API Keys
    getKeys: async () => {
        const { data } = await apiClient.get('/keys');
        return data as { data: ApiKey[] };
    },
    createKey: async (name: string) => {
        const { data } = await apiClient.post('/keys', { name });
        return data as { data: ApiKey & { rawKey: string }; meta: { warning: string } };
    },
    deleteKey: async (id: string) => {
        const { data } = await apiClient.delete(`/keys/${id}`);
        return data;
    },

    // Dashboard stats
    getDashboardStats: async () => {
        const { data } = await apiClient.get('/dashboard/stats');
        return data as { data: DashboardStats };
    },
};
