import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL

// init socket (singleton)
export const initSocket = (userId: string) => {
  if (!socket) {
    socket = io(APP_URL, {
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
      socket?.emit("join", userId);
    });
  }
  socket.emit("join", userId);

  return socket;
};

// get instance
export const getSocket = () => {
  if (!socket) throw new Error("Socket not initialized");
  return socket;
};

// =======================
// notification handlers
// =======================

export const onNotificationNew = (callback: (data: any) => void) => {
  socket?.on("new_notification", callback);
};

export const onNotificationRead = (callback: (data: any) => void) => {
  socket?.on("read_notification", callback);
};

export const onNotificationReadAll = (callback: (data: any) => void) => {
  socket?.on("readAll_notification", callback);
};

export const onNotificationDelete = (callback: (data: any) => void) => {
  socket?.on("delete_notification", callback);
};

export const onNotificationDeleteAll = (callback: (data: any) => void) => {
  socket?.on("deleteAll_notification", callback);
};

export type TopicResolveSuggestionPayload = {
  topicId: string;
  topicKey: string;
  projectId: string;
  notificationId?: string;
};

export const onTopicResolveSuggestion = (
  callback: (data: TopicResolveSuggestionPayload) => void,
) => {
  socket?.on("topic_resolve_suggestion", callback);
};

export const offTopicResolveSuggestion = () => {
  socket?.off("topic_resolve_suggestion");
};

// cleanup
export const offNotificationEvents = () => {
  socket?.off("new_notification");
  socket?.off("readAll_notification");
  socket?.off("read_notification");
  socket?.off("delete_notification");
  socket?.off("deleteAll_notification");
  offTopicResolveSuggestion();
};
