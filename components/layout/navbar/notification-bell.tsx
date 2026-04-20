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
import { useRouter } from "next/navigation";

export function BellComponent() {
  const { user } = useAuth();
  const router = useRouter();

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
      // Normalize incoming notification from socket so UI doesn't break
      const normalized: INotification = {
        _id:
          newNotification._id ??
          newNotification.id ??
          `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        userId: newNotification.userId ?? user._id ?? "",
        title: newNotification.title ?? "Notification",
        content: newNotification.content ?? "",
        isRead: typeof newNotification.isRead === "boolean" ? newNotification.isRead : false,
        url: newNotification.url,
        createdAt:
          typeof newNotification.createdAt === "string"
            ? newNotification.createdAt
            : newNotification.createdAt
              ? new Date(newNotification.createdAt).toISOString()
              : new Date().toISOString(),
        updatedAt:
          typeof newNotification.updatedAt === "string"
            ? newNotification.updatedAt
            : newNotification.updatedAt
              ? new Date(newNotification.updatedAt).toISOString()
              : new Date().toISOString(),
      };

      queryClient.setQueryData(
        ["notifications", user._id],
        (old: INotification[] = []) => [normalized, ...old],
      );

      // refetch from server to get canonical IDs and data so actions work immediately
      void queryClient.invalidateQueries({ queryKey: ["notifications", user._id] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
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
      offNotificationEvents();
    };
  }, [user?._id, queryClient]);

  // 🟡 ACTIONS

  const handleMarkAsRead = async (id: string) => {
    if (!id || id.startsWith("temp_")) return;
    await NotificationService.readNotification(id);
  };

  const handleNavigate = async (notification: INotification) => {
    await handleMarkAsRead(notification._id);

    if (notification.url) {
      router.push(notification.url);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!id || id.startsWith("temp_")) return;
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
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs">
              Mark all as read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center px-4 py-8 text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications?.map((notification, idx) => (
              <div
                key={notification._id ?? notification.createdAt ?? idx}
                className={`border-b border-border px-4 py-3 transition-colors hover:bg-muted ${!notification.isRead ? "bg-blue-50 dark:bg-blue-950/30" : ""
                  }`}>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleNavigate(notification)}>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification._id);
                    }}
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
