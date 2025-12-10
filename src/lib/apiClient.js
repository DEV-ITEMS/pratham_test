const BASE_URL = 'http://localhost:4000';

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const normalizeOptions = (options) => (typeof options === 'object' && options !== null ? options : {});

const buildQueryString = (query) => {
  if (!query) return '';
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, String(entry)));
      return;
    }
    params.append(key, String(value));
  });

  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

const request = async (path, { method = 'GET', body, token, query } = {}) => {
  const url = new URL(path, BASE_URL);
  const search = buildQueryString(query);
  if (search) {
    url.search = search;
  }

  const headers = { Accept: 'application/json' };
  const options = { method, headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    } else {
      options.body = body;
    }
  }

  const response = await fetch(url.toString(), options);
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = (payload && payload.message) || (typeof payload === 'string' ? payload : undefined) || 'Request failed';
    throw new ApiError(message, response.status, payload);
  }

  return payload;
};

export const apiClient = {
  // Auth
  async login({ email, password }) {
    return request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  async signup({ name, email, password }) {
    return request('/auth/signup', {
      method: 'POST',
      body: { name, email, password },
    });
  },

  async me({ token } = {}) {
    return request('/auth/me', { token });
  },

  // Organization
  async getOrg({ token } = {}) {
    return request('/org', { token });
  },

  async getSeatUsage({ token } = {}) {
    return request('/org/seat-usage', { token });
  },

  async fetchOrg(_orgId, options) {
    const { token } = normalizeOptions(options);
    return this.getOrg({ token });
  },

  async fetchOrgBySlug(slug, options) {
    const { token } = normalizeOptions(options);
    const org = await this.getOrg({ token });
    return org?.slug === slug ? org : null;
  },

  async fetchOrgMembers(_orgId, options) {
    const { token } = normalizeOptions(options);
    return request('/org/members', { token });
  },

  async fetchSeatUsage(_orgId, options) {
    const { token } = normalizeOptions(options);
    return this.getSeatUsage({ token });
  },

  // Projects
  async getProjects({ token, portfolio, visibility, page, pageSize } = {}) {
    return request('/projects', {
      token,
      query: { portfolio, visibility, page, pageSize },
    });
  },

  async fetchProjects(_orgId, options) {
    const { token, portfolio, visibility, page, pageSize } = normalizeOptions(options);
    const result = await this.getProjects({ token, portfolio, visibility, page, pageSize });
    return Array.isArray(result?.items) ? result.items : result ?? [];
  },

  async fetchPortfolioProjects(_orgId, options) {
    const { token, visibility, page, pageSize } = normalizeOptions(options);
    const result = await this.getProjects({ token, portfolio: true, visibility, page, pageSize });
    return Array.isArray(result?.items) ? result.items : result ?? [];
  },

  async fetchProjectBySlug(slug, options) {
    const { token } = normalizeOptions(options);
    try {
      return await request(`/projects/${encodeURIComponent(slug)}`, { token });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // Fallback for backends without slug route: fetch list and match locally.
        const list = await this.getProjects({ token, pageSize: 100 });
        const items = Array.isArray(list?.items) ? list.items : [];
        return items.find((item) => item.slug === slug) ?? null;
      }
      throw error;
    }
  },

  async fetchPublicProject(slug) {
    return request(`/p/${encodeURIComponent(slug)}`);
  },

  async fetchProjectHierarchy(projectId, options) {
    const { token } = normalizeOptions(options);
    return request(`/projects/${encodeURIComponent(projectId)}/buildings`, {
      token,
      query: { includeHierarchy: true },
    });
  },

  async fetchHierarchyTree(projectId, options) {
    const { token } = normalizeOptions(options);
    return request(`/projects/${encodeURIComponent(projectId)}/buildings`, {
      token,
      query: { tree: true },
    });
  },

  async fetchInitialSelection(projectId, options) {
    const { token } = normalizeOptions(options);
    return request(`/projects/${encodeURIComponent(projectId)}/initial-selection`, { token });
  },

  // Views & assets
  async fetchRoomViews(roomId, options) {
    const { token } = normalizeOptions(options);
    return request(`/rooms/${encodeURIComponent(roomId)}/views`, { token });
  },

  async fetchPinsForView(viewId, options) {
    const { token } = normalizeOptions(options);
    return request(`/views/${encodeURIComponent(viewId)}/pins`, { token });
  },

  async fetchPanoramaAsset(viewId, options) {
    const { token } = normalizeOptions(options);
    return request(`/views/${encodeURIComponent(viewId)}/asset`, { token });
  },

  // Sharing
  async fetchSharing(projectId, options) {
    const { token } = normalizeOptions(options);
    return request('/share-links', { token, query: { projectId } });
  },

  async updateSharing(projectId, payload, options) {
    const { token } = normalizeOptions(options);
    return request('/share-links', {
      method: 'POST',
      token,
      query: { projectId },
      body: payload,
    });
  },

  // Analytics
  async fetchAnalytics(projectId, options) {
    const { token } = normalizeOptions(options);
    return request('/analytics/summary', { token, query: { projectId } });
  },

  async recordSnapshot(projectId, options) {
    const { token, viewId } = normalizeOptions(options);
    return request('/analytics/events', {
      method: 'POST',
      token,
      body: { projectId, viewId, type: 'SNAPSHOT' },
    });
  },
};
