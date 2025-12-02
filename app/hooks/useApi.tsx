import axios, { AxiosRequestConfig } from "axios";

export const client = axios.create({
  baseURL: process?.env.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  } 
  return config;
}));

export const useApi = () => ({
    // GET
    async get(path: string, config?: AxiosRequestConfig) {
        const res = await client.get(path, config);
        return res?.data
    },

    // POST
    async post<T>(path: string, data?: T, config?: AxiosRequestConfig) {
        const res = await client.post(path, data, config);
        return res.data;
    },

    // PUT
    async put<T>(path: string, data?: T, config?: AxiosRequestConfig) {
        const res = await client.put(path, data, config);
        return res?.data;
    },
    // PATCH
    async patch<T>(path: string, data?: T, config?: AxiosRequestConfig) {
        const res = await client.patch(path, data, config);
        return res?.data;
    },
    // DELETE
    async delete(path: string, config?: AxiosRequestConfig) {
        const res = await client.delete(path, config);
        return res?.data;
    }
})