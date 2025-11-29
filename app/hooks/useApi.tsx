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
        const res = await client.get<any>(path, config);
    },

    // POST
    async post(path: string, data?: any, config?: AxiosRequestConfig) {
        const res = await client.post<any>(path, data, config);
        return res.data;
    },

    // PUT
    async put(path: string, data?: any, config?: AxiosRequestConfig) {
        const res = await client.put<any>(path, data, config);
        return res?.data;
    },
    // PATCH
    async patch(path: string, data?: any, config?: AxiosRequestConfig) {
        const res = await client.patch<any>(path, data, config);
        return res?.data;
    },
    // DELETE
    async delete(path: string, config?: AxiosRequestConfig) {
        const res = await client.delete<any>(path, config);
        return res?.data;
    }
})