export interface IUserShort {
  _id: string;
  fullName: string;
  avatar?: string;
}

export interface IComment {
  _id: string;
  content: string;
  targetId: string;
  targetType: "file" | "folder" | "release" | "topic";
  createdBy: IUserShort;
  createdAt: string;
  updatedAt: string;
}

export interface ICommentResponse {
  comments: IComment[];
  total: number;
  hasMore: boolean;
}
