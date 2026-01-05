import { httpClient } from "@/lib/http-client";
import { IFile } from "@/types/explorer";

export const fileService = {
  getById(fileId: string) {
    return httpClient.get<IFile>(`/files/${fileId}`).then(res => res.data);
  },
};