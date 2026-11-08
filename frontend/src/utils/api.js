// CareConnect Central API Client
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new CustomEvent("careconnect:session-expired", {
      detail: { message: "Your session has expired. Please log in again." }
    }));
  }

  return response;
};

export const getList = (result, key) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (key && Array.isArray(result[key])) return result[key];
  if (Array.isArray(result.data)) return result.data;
  if (key && Array.isArray(result.data?.[key])) return result.data[key];
  return [];
};

export { BASE_URL };
