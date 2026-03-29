import { httpClient } from "@/lib/http-client";

export interface ResolveShareResponse {
  projectId: string;
  fileId: string;
  accessLevel: "VIEW" | "DOWNLOAD";
  type: string;
}

export const shareService = {
  resolveShare(token: string): Promise<ResolveShareResponse> {
    return httpClient
      .get<ResolveShareResponse>(`/share/${token}`)
      .then((res) => res.data);
  },
};
