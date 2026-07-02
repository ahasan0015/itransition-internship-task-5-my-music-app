import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
//   withCredentials: true, // only for session and if login require
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
});

// INTERCEPTORS ONLY FOR LOGING ERROR
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.status || error.message);
    return Promise.reject(error);
  }
);

export default api;