export interface INotification {
  _id: string;
  userId: string;
  title: string;
  content: string;
  isRead: boolean;
  url?: string;
  createdAt: string;
  updatedAt: string;
}
