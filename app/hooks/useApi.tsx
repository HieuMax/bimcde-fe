import { AxiosRequestConfig } from "axios";
import { client } from "../utils/apiClient";

export const useApi = () => ({
  // GET
  async get(path: string, config?: AxiosRequestConfig) {
    const res = await client.get(path, config);
    return res?.data;
  },

  // POST
  async post<T>(path: string, data?: T, config?: AxiosRequestConfig) {
    const res = await client.post(path, data, config);
    return res.data;
  },
  // POST RAW
  async postRaw<T>(path: string, data?: T, config?: AxiosRequestConfig) {
    const res = await client.post(path, data, config);
    return res; // Trả về nguyên cục response để lấy headers
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
  },
});
