import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true
});

// Interceptor to attach Authorization header if token exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const authAPI = {
  login: async (credentials) => {
    const res = await API.post("/auth/login", credentials);
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    }
    return res.data;
  },
  register: async (userData) => {
    const res = await API.post("/auth/register", userData);
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    }
    return res.data;
  },
  getMe: async () => {
    const res = await API.get("/auth/me");
    return res.data;
  },
  logout: () => {
    localStorage.removeItem("token");
  }
};

export const tenderAPI = {
  getAll: async (params) => {
    const res = await API.get("/tenders", { params });
    return res.data.data;
  },
  getStats: async () => {
    const res = await API.get("/tenders/stats");
    return res.data.data;
  },
  getById: async (id) => {
    const res = await API.get(`/tenders/${id}`);
    return res.data.data;
  },
  create: async (tenderData) => {
    const res = await API.post("/tenders", tenderData);
    return res.data.data;
  },
  getAdminTenders: async () => {
    const res = await API.get("/tenders/admin/my-tenders");
    return res.data.data;
  }
};

export const bidAPI = {
  submit: async (bidData) => {
    const res = await API.post("/bids", bidData);
    return res.data.data;
  },
  getMyBids: async () => {
    const res = await API.get("/bids/my-bids");
    return res.data.data;
  },
  getAllAdminBids: async () => {
    const res = await API.get("/bids/admin/all-bids");
    return res.data.data;
  },
  getByTender: async (tenderId) => {
    const res = await API.get(`/bids/tender/${tenderId}`);
    return res.data;
  }
};

export const savedAPI = {
  getSaved: async () => {
    const res = await API.get("/saved-tenders");
    return res.data;
  },
  toggleSave: async (tenderId) => {
    const res = await API.post(`/saved-tenders/${tenderId}`);
    return res.data;
  }
};

export default API;
