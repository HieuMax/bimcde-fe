import axios, { AxiosRequestConfig } from "axios";
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
    console.log("POST response data:", res.data);
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
  },
});
