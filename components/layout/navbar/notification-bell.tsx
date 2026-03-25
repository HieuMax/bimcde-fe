"use client";

import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/app/context/authContext";
import { NotificationService } from "@/services/notification.service ";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { INotification } from "@/types/notification";
import {
  initSocket,
  offNotificationEvents,
  onNotificationDelete,
  onNotificationDeleteAll,
  onNotificationNew,
  onNotificationRead,
  onNotificationReadAll,
} from "@/app/libs/socket";
import { useEffect } from "react";

export function BellComponent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<INotification[]>({
    queryKey: ["notifications", user?._id],
    queryFn: () => NotificationService.getAllNotification(user?._id),
    enabled: !!user?._id,
  });

  // 🔥 SOCKET REALTIME
  useEffect(() => {
    if (!user?._id) return;

    initSocket(user._id);

    // 🟢 NEW
    onNotificationNew((newNotification) => {
      queryClient.setQueryData(
        ["notifications", user._id],
        (old: INotification[] = []) => [newNotification, ...old],
      );
    });

    // 🟡 READ
    onNotificationRead((id) => {
      queryClient.setQueryData(
        ["notifications", user._id],
        (old: INotification[] = []) =>
          old.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
    });

    // 🟡 READ ALL
    onNotificationReadAll(() => {
      queryClient.setQueryData(
        ["notifications", user._id],
        (old: INotification[] = []) => old.map((n) => ({ ...n, isRead: true })),
      );
    });

    // 🔴 DELETE
    onNotificationDelete((id) => {
      queryClient.setQueryData(
        ["notifications", user._id],
        (old: INotification[] = []) => old.filter((n) => n._id !== id),
      );
    });

    // // 🔴 DELETE ALL
    // onNotificationDeleteAll(() => {
    //   queryClient.setQueryData(["notifications", user._id], () => []);
    // });

    return () => {
      offNotificationEvents(); // ✅ đúng
    };
  }, [user?._id, queryClient]);

  // 🟡 ACTIONS

  const handleMarkAsRead = async (id: string) => {
    await NotificationService.readNotification(id);
  };

  const handleDeleteNotification = async (id: string) => {
    await NotificationService.deleteNotification(id);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?._id) return;

    await NotificationService.readAllNotification(user?._id);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-semibold">Thông báo</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs">
              Đánh dấu tất cả
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center px-4 py-8 text-sm text-muted-foreground">
              Không có thông báo
            </div>
          ) : (
            notifications?.map((notification) => (
              <div
                key={notification._id ?? notification.createdAt}
                className={`border-b border-border px-4 py-3 transition-colors hover:bg-muted ${
                  !notification.isRead ? "bg-blue-50 dark:bg-blue-950/30" : ""
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleMarkAsRead(notification._id)}>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.content}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNotification(notification._id)}
                    className="h-6 w-6 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
