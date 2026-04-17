import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Search,
  ChevronDown,
  Check,
  Plus,
  ChevronRight,
  Box,
  FileText,
  Folder,
  FolderSearch,
  LinkIcon,
  X,
  AlertCircle,
  Bookmark,
  Circle,
  ArrowLeft,
  Camera,
  MessageSquare,
  MoreVertical,
  Pencil,
  Play,
  Trash2,
  ListTodo,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { TopicItem } from "@/types/topic3d";
import type { ITodo } from "@/types/todo3d";
import { topicService } from "@/services/topic3d.service";
import { todoService } from "@/services/todo3d.service";
import { explorerService } from "@/services/explorer.service";
import { useComments } from "@/components/features/explorer/hooks/useComments";
import CommentList from "@/components/features/explorer/properties/components/comments/CommentList";
import CommentInput from "@/components/features/explorer/properties/components/comments/CommentInput";
import { TopicTodoView } from "@/components/features/topics/TopicTodoView";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

function getTodoLinkedTopicItemId(t: ITodo): string | null {
  const raw = t.topicItemId ?? t.topicId;
  if (raw == null) return null;
  if (typeof raw === "object" && raw !== null && "_id" in raw) {
    return String((raw as { _id?: string })._id);
  }
  return String(raw);
}

type GroupByType = "none" | "status" | "assignee" | "priority";
type ViewState = "list" | "create" | "references" | "detail" | "edit";

export function Topics({
  projectId,
  ifcUrls = [],
  autoOpenTopicId = null,
  capture3DState,
  onRestoreView,
  onOpenTopicContext,
  onAutoOpenTopicHandled,
  onAddMarkerStart,
  onAddMarkerCancel,
  onAddTodoForTopic,
}: {
  projectId: string;
  ifcUrls?: string[];
  autoOpenTopicId?: string | null;
  capture3DState: () => Promise<{
    viewState: any;
    items: any[];
    thumbnail: string;
  }>;
  onRestoreView: (viewState: any, items: any[]) => void;
  onOpenTopicContext?: (topic: TopicItem, targetUrls: string[]) => void | Promise<void>;
  onAutoOpenTopicHandled?: () => void;
  onAddMarkerStart?: (
    callback: (point: { x: number; y: number; z: number }) => void,
  ) => void;
  onAddMarkerCancel?: () => void;
  /** Opens 3D todo drawer with this Topic3D preset as parent. */
  onAddTodoForTopic?: (topicId: string) => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();

  const [view, setView] = useState<ViewState>("list");

  const [selectedTopic3D, setSelectedTopic3D] = useState<TopicItem | null>(
    null,
  );
  const [activeSnapshotIndex, setActiveSnapshotIndex] = useState<number>(0);

  const [isAddingMarker, setIsAddingMarker] = useState(false); // Toggle thêm marker mode
  const [showIn3D, setShowIn3D] = useState(true); // Toggle 3D

  const [isCoordinationExpanded, setIsCoordinationExpanded] = useState(true);
  const [activeDetailTab, setActiveDetailTab] = useState("views");

  // hooks comment
  const {
    comments,
    totalComments,
    isLoading: isCommentsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    commentInput,
    setCommentInput,
    addComment,
    isAdding: isAddingComment,
    updateComment,
    deleteComment,
    currentUserId,
  } = useComments(selectedTopic3D?._id || "", "topic");

  // --- STATE ---
  const [closedExpanded, setClosedExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "date-created" | "name" | "date-modified"
  >("date-created");

  // State Group By
  const [groupBy, setGroupBy] = useState<GroupByType>("none");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  // State Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  //   const [todoToEdit, setTodoToEdit] = useState<ITodo | null>(null)
  const [drawerMode, setDrawerMode] = useState<"view" | "edit" | "create">(
    "view",
  );
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );

  //File Explorer Manage References
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const [selectedRefs, setSelectedRefs] = useState<string[]>([]);

  const [addTodosOpen, setAddTodosOpen] = useState(false);
  const [todoLinkSearch, setTodoLinkSearch] = useState("");
  const [selectedTodoIds, setSelectedTodoIds] = useState<Set<string>>(
    () => new Set(),
  );
  /** Detail panel: full topic vs todo list (like /topics “See Todo List”). */
  const [detailSubview, setDetailSubview] = useState<"main" | "todos">("main");

  // Query State
  const { data: explorerData, isLoading: isExplorerLoading } = useQuery({
    queryKey: ["explorer", projectId, currentFolderId],
    queryFn: () => explorerService.getContent(projectId, currentFolderId),
    enabled: !!projectId && view === "references",
  });

  const handleFolderClick = (folderId: string) => {
    setFolderHistory((prev) => [...prev, currentFolderId || "root"]);
    setCurrentFolderId(folderId);
  };

  const handleBackFolder = () => {
    const newHistory = [...folderHistory];
    const prevId = newHistory.pop();
    setFolderHistory(newHistory);
    setCurrentFolderId(prevId === "root" ? null : prevId || null);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedRefs((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  // --- QUERIES ---
  //   const { data: todos = [], isLoading } = useQuery({
  //     queryKey: ["todos", projectId, statusFilter],
  //     queryFn: () => todoService.getAll(projectId, statusFilter ? { status: statusFilter } : undefined),
  //     enabled: !!projectId,
  //   })

  // TOPICS
  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["topics", projectId, statusFilter, searchQuery, sortBy],
    queryFn: () =>
      topicService.getTopicsByProject(projectId, {
        status: statusFilter,
        search: searchQuery,
        sortBy,
      }),
    enabled: !!projectId,
  });

  const { data: linkedTodoOpen } = useQuery({
    queryKey: ["topic-linked-open-todos", selectedTopic3D?._id],
    queryFn: () => topicService.getOpenLinkedTodoCount(selectedTopic3D!._id),
    enabled: !!selectedTopic3D?._id && view === "edit",
  });
  const blockingTodoCount = linkedTodoOpen?.count ?? 0;

  const { data: projectTodos = [], isLoading: projectTodosLoading } = useQuery({
    queryKey: ["todos", projectId],
    queryFn: () => todoService.getAll(projectId),
    enabled: !!projectId && addTodosOpen,
  });

  const linkableTodos = useMemo(() => {
    if (!selectedTopic3D) return [];
    const topicId = String(selectedTopic3D._id);
    const q = todoLinkSearch.trim().toLowerCase();
    return (projectTodos as ITodo[]).filter((t) => {
      const linked = getTodoLinkedTopicItemId(t);
      if (linked === topicId) return false;
      if (!q) return true;
      const title = (t.title || "").toLowerCase();
      const status = String(t.status || "").toLowerCase();
      return title.includes(q) || status.includes(q);
    });
  }, [projectTodos, selectedTopic3D, todoLinkSearch]);

  const linkTodosToTopicMutation = useMutation({
    mutationFn: async (todoIds: string[]) => {
      if (!selectedTopic3D) return;
      const topicItemId = selectedTopic3D._id;
      await Promise.all(
        todoIds.map((id) =>
          todoService.update(id, { topicItemId: topicItemId }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", projectId] });
      queryClient.invalidateQueries({ queryKey: ["topics", projectId] });
      if (selectedTopic3D?._id) {
        queryClient.invalidateQueries({
          queryKey: ["topic-linked-open-todos", selectedTopic3D._id],
        });
      }
      toast.success("Todos linked to this topic");
      setAddTodosOpen(false);
      setSelectedTodoIds(new Set());
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Failed to link todos";
      toast.error(msg);
    },
  });

  const toggleTodoLinkSelection = (id: string) => {
    setSelectedTodoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const topicDisplayById = useMemo(() => {
    const m = new Map<string, string>();
    for (const top of topics) {
      m.set(top._id, `${top.topicKey} — ${top.title}`);
    }
    return m;
  }, [topics]);

  const normalizeIfcUrl = (url?: string) => {
    if (!url) return "";
    const decoded = decodeURIComponent(String(url)).trim().toLowerCase();
    return decoded.split("#")[0].split("?")[0];
  };

  const extractIfcFileKey = (url?: string) => {
    const normalizedUrl = normalizeIfcUrl(url);
    if (!normalizedUrl) return "";

    const baseName = normalizedUrl.split("/").pop() || normalizedUrl;
    return baseName.replace(/^\d+_[0-9a-f-]+_/i, "");
  };

  const urlsMatch = (left?: string, right?: string) => {
    const normalizedLeft = normalizeIfcUrl(left);
    const normalizedRight = normalizeIfcUrl(right);
    const leftFileKey = extractIfcFileKey(left);
    const rightFileKey = extractIfcFileKey(right);

    if (!normalizedLeft || !normalizedRight) return false;
    if (normalizedLeft === normalizedRight) return true;
    if (leftFileKey && rightFileKey && leftFileKey === rightFileKey) return true;
    return (
      normalizedLeft.endsWith(normalizedRight) ||
      normalizedRight.endsWith(normalizedLeft)
    );
  };

  const activeIfcUrls = useMemo(
    () => (ifcUrls || []).map(normalizeIfcUrl).filter(Boolean),
    [ifcUrls],
  );

  const extractTopicFileUrls = (
    topic: TopicItem,
    options?: { includeSnapshots?: boolean },
  ) => {
    const relatedUrls = new Set<string>();
    const collectUrl = (value?: string) => {
      const normalized = normalizeIfcUrl(value);
      if (normalized) relatedUrls.add(normalized);
    };

    const collectItems = (items?: any[]) => {
      if (!Array.isArray(items)) return;
      items.forEach((item: any) => collectUrl(item?.fileUrl));
    };

    collectItems(topic.items);
    collectItems(topic.viewState?.selection);

    if (Array.isArray(topic.viewState?.visibility)) {
      topic.viewState.visibility.forEach((item: any) => collectUrl(item?.fileUrl));
    }

    if (options?.includeSnapshots && Array.isArray(topic.snapshots)) {
      topic.snapshots.forEach((snapshot: any) => {
        collectItems(snapshot?.items);
        collectItems(snapshot?.viewState?.selection);

        if (Array.isArray(snapshot?.viewState?.visibility)) {
          snapshot.viewState.visibility.forEach((item: any) =>
            collectUrl(item?.fileUrl),
          );
        }
      });
    }

    return Array.from(relatedUrls);
  };

  const extractPrimaryTopicFileUrls = (topic: TopicItem) =>
    extractTopicFileUrls(topic, { includeSnapshots: false });

  const topicBelongsToCurrentModels = (topic: TopicItem) => {
    if (activeIfcUrls.length === 0) return true;

    const topicUrls = extractPrimaryTopicFileUrls(topic);
    if (topicUrls.length === 0) return true;

    return topicUrls.every((topicUrl) =>
      activeIfcUrls.some((activeUrl) => urlsMatch(topicUrl, activeUrl)),
    );
  };

  const [formData, setFormData] = useState<Partial<TopicItem>>({
    title: "",
    description: "",
    type: "Undefined",
    priority: "Normal",
    status: "New",
    // projectId: projectId
  });

  const createMutation = useMutation({
    mutationFn: (newTopic: Partial<TopicItem>) =>
      topicService.createTopic(newTopic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics", projectId] });
      setView("list");
      setFormData({
        title: "",
        description: "",
        type: "Undefined",
        priority: "Normal",
        status: "New",
      });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Create topic failed";
      toast.error(msg);
    },
  });

  const stopViewerHotkeys = (e: React.KeyboardEvent<HTMLElement>) => {
    // Avoid global 3D hotkeys hijacking keys while typing in form fields.
    e.stopPropagation();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => topicService.deleteTopic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics", projectId] });
      setView("list");
      setSelectedTopic3D(null);
    },
  });

  const editInfoMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<TopicItem>;
    }) => topicService.updateTopic(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["topics", projectId] });
      setSelectedTopic3D(data); // Cập nhật data mới lên Detail View
      setView("detail"); // Quay lại màn hình Detail
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Update failed";
      toast.error(msg);
    },
  });

  const addSnapshotMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      topicService.addSnapshot(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["topics", projectId] });
      setSelectedTopic3D(data); // Cập nhật lại UI ngay lập tức
    },
  });

  const handleCreateSubmit = async () => {
    if (!formData.title) return alert("Title is required");

    const safeProjectId =
      projectId || (params?.projectId as string) || (params?.id as string);
    if (!projectId) {
      alert("Error: Project ID not found.");
      return;
    }

    let payload: any = {
      ...formData,
      projectId: safeProjectId,
      references: selectedRefs,
    };

    if (!payload.assignee || payload.assignee.trim() === "") {
      delete payload.assignee;
    }

    if (!payload.dueDate) {
      delete payload.dueDate;
    }

    if (capture3DState) {
      try {
        const { viewState, items, thumbnail } = await capture3DState();
        payload = {
          ...payload,
          viewState,
          items,
          thumbnailUrl: thumbnail,
        };

        // Extract fileId from items if available
        if (items && items.length > 0 && items[0].fileUrl) {
          try {
            // Try to resolve fileId from the file explorer service
            // by searching files that match the fileUrl
            console.log("[Topic Create] Attempting to resolve fileId from fileUrl...");
            // TODO: Implement file search by URL to get fileId
            // For now, fileId will be added during backend processing
          } catch (error) {
            console.warn("[Topic Create] Could not resolve fileId from fileUrl:", error);
          }
        }
      } catch (error) {
        console.error("Error capturing 3D state:", error);
      }
    }
    console.log("🚀 Payload gửi lên API:", payload);
    // Gọi API tạo mới
    createMutation.mutate(payload);
  };

  const handleAddReferencesSubmit = () => {
    if (selectedTopic3D) {
      // Nếu đang ở màn hình Detail -> Gọi API Update Topic luôn
      editInfoMutation.mutate({
        id: selectedTopic3D._id,
        payload: { references: selectedRefs },
      });
    } else {
      // Nếu đang ở màn hình Create -> Chỉ lưu state và quay lại form
      setView("create");
    }
  };

  const handleCaptureNewView = async () => {
    if (!capture3DState || !selectedTopic3D) return;
    try {
      const { viewState, thumbnail } = await capture3DState();

      // Lấy selection từ viewState - đây đã là format flat đúng chuẩn
      const finalSelection = viewState.selection || [];

      // KHÔNG cần group lại nữa, lưu thẳng format flat
      const itemsToSave = finalSelection.length > 0 
        ? finalSelection 
        : (selectedTopic3D.items || []);

      if (selectedTopic3D.viewState?.marker) {
        viewState.marker = selectedTopic3D.viewState.marker;
      }

      const payload = {
        viewState,
        items: itemsToSave, // Lưu format flat
        thumbnailUrl: thumbnail,
      };
      
      addSnapshotMutation.mutate({ id: selectedTopic3D._id, payload }); 
    } catch (error) {
      console.error("Error capturing view:", error);
    }
  };

  const deleteSnapshotMutation = useMutation({
    mutationFn: ({ topicId, snapshotId }: any) =>
      topicService.deleteSnapshot(topicId, snapshotId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["topics", projectId] });
      setSelectedTopic3D(data);
    },
  });

  const deleteAllSnapshotsMutation = useMutation({
    mutationFn: (topicId: string) =>
      topicService.deleteAllSnapshots(topicId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["topics", projectId] });
      setSelectedTopic3D(data);
    },
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDeleteTopic = () => {
    if (!selectedTopic3D) return;
    if (
      window.confirm(
        `Are you sure you want to delete topic "${selectedTopic3D.topicKey}"?`,
      )
    ) {
      deleteMutation.mutate(selectedTopic3D._id);
    }
  };

  const handleEditTopicClick = () => {
    if (!selectedTopic3D) return;
    // Đổ dữ liệu cũ vào form để người dùng sửa
    setFormData({
      title: selectedTopic3D.title,
      description: selectedTopic3D.description || "",
      type: selectedTopic3D.type,
      priority: selectedTopic3D.priority,
      status: selectedTopic3D.status,
      dueDate: selectedTopic3D.dueDate,
      assignee: selectedTopic3D.assignee,
    });
    setView("edit");
  };

  const handleEditSubmit = () => {
    if (!selectedTopic3D) return;
    if (!formData.title) return alert("Title is required");

    const payload = { ...formData };
    if (!payload.assignee || payload.assignee.trim() === "")
      delete payload.assignee;
    if (!payload.dueDate) delete payload.dueDate;

    editInfoMutation.mutate({ id: selectedTopic3D._id, payload });
  };

  // references
  const handleDownloadAllReferences = async () => {
    if (!selectedTopic3D?.references || selectedTopic3D.references.length === 0)
      return;
    try {
      // Map danh sách file để gọi hàm downloadBulk của explorerService
      const items = selectedTopic3D.references.map((r: any) => ({
        _id: r._id,
        type: "file" as const,
      }));
      await explorerService.downloadBulkItems(items, projectId);
    } catch (error) {
      console.error("Error downloading all references:", error);
      alert("Failed to download references.");
    }
  };

  const handleRemoveAllReferences = () => {
    if (!selectedTopic3D) return;
    if (window.confirm("Are you sure you want to remove all references?")) {
      // Gọi mutation update lại references thành mảng rỗng
      editInfoMutation.mutate({
        id: selectedTopic3D._id,
        payload: { references: [] },
      });
    }
  };

  const handleViewReference = (file: any) => {
    if (!file || !file._id) return;
    const viewerUrl = `/projects/${projectId}/viewer/${file._id}`;
    window.open(viewerUrl, "_blank");
  };

  const handleDownloadReference = async (file: any) => {
    try {
      await explorerService.downloadItem(file._id, "file", file.name);
    } catch (error) {
      console.error("Error downloading reference:", error);
      alert("Failed to download file.");
    }
  };

  const handleLocateInExplorer = (file: any) => {
    if (!file) return;

    let targetUrl = `/projects/${projectId}/data`;

    if (file.folderId) {
      targetUrl += `?folderId=${file.folderId}`;
    }

    router.push(targetUrl);
    // Tuỳ vào route dự án của bạn để redirect sang trang file manager
    // Ví dụ: router.push(`/projects/${projectId}/files?folderId=${file.folderId}`);
    // alert(`Need routing to Explorer for folder ID: ${file.folderId}`);
  };

  const handleRemoveReference = (fileId: string) => {
    if (!selectedTopic3D) return;
    // Lọc bỏ file hiện tại ra khỏi mảng và lấy mảng ID mới
    const updatedRefs =
      selectedTopic3D.references
        ?.filter((r: any) => r._id !== fileId)
        .map((r: any) => r._id) || [];

    editInfoMutation.mutate({
      id: selectedTopic3D._id,
      payload: { references: updatedRefs },
    });
  };

  // Helper function to normalize items to flat format
  const normalizeItemsToFlat = (items: any[]): any[] => {
    if (!items || items.length === 0) return [];
    
    // Nếu là format grouped cũ (có expressId là mảng)
    if (Array.isArray(items[0]?.expressId)) {
      const flatItems: any[] = [];
      items.forEach((group: any) => {
        const expressIds = group.expressId || [];
        expressIds.forEach((id: string) => {
          flatItems.push({
            modelID: Number(group.modelId),
            expressID: Number(id),
            fileUrl: group.fileUrl
          });
        });
      });
      return flatItems;
    }
    
    // Nếu là format flat mới
    if (items[0]?.expressID !== undefined) {
      return items.map((item: any) => ({
        modelID: Number(item.modelID),
        expressID: Number(item.expressID),
        fileUrl: item.fileUrl
      }));
    }
    
    return items;
  };

  const getRestorableItems = (...sources: any[]): any[] => {
    for (const source of sources) {
      const normalized = normalizeItemsToFlat(
        Array.isArray(source) ? source : [],
      ).filter((item: any) => item?.fileUrl && item?.expressID !== undefined);

      if (normalized.length > 0) {
        return normalized;
      }
    }

    return [];
  };

  const restoreTopicView = (viewState: any, ...itemSources: any[]) => {
    if (!onRestoreView || !viewState) return;

    const restorableItems = getRestorableItems(
      ...itemSources,
      viewState?.selection,
    );

    onRestoreView(
      {
        ...viewState,
        selection: restorableItems,
      },
      restorableItems,
    );
  };

  const openTopicDetail = (
    topic: TopicItem,
    options?: { skipContextSwitch?: boolean },
  ) => {
    const targetUrls = extractPrimaryTopicFileUrls(topic);
    const shouldSwitchContext =
      !options?.skipContextSwitch &&
      !topicBelongsToCurrentModels(topic) &&
      targetUrls.length > 0;

    if (shouldSwitchContext) {
      onOpenTopicContext?.(topic, targetUrls);
      return;
    }

    setSelectedTopic3D(topic);
    setActiveSnapshotIndex(0);
    setDetailSubview("main");
    setView("detail");

    if (topic.viewState) {
      restoreTopicView(topic.viewState, topic.items, topic.viewState?.selection);
    }
  };

  const openTopics = useMemo(
    () => topics.filter((t) => t.status !== "Closed"),
    [topics]
  );

  const closedTopics = useMemo(
    () => topics.filter((t) => t.status === "Closed"),
    [topics]
  );

  useEffect(() => {
    if (!autoOpenTopicId || topics.length === 0) return;

    const topicToOpen = topics.find((topic) => topic._id === autoOpenTopicId);
    if (topicToOpen) {
      openTopicDetail(topicToOpen, { skipContextSwitch: true });
    }

    onAutoOpenTopicHandled?.();
  }, [autoOpenTopicId, topics]);

  const renderDetailView = () => {
    if (!selectedTopic3D) return null;

    if (detailSubview === "todos") {
      return (
        <div className="flex flex-col flex-1 bg-white h-full relative min-h-0">
          <div className="flex items-center justify-between p-3 border-b border-slate-200 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDetailSubview("main")}
              title="Back to topic"
              aria-label="Back to topic"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <span className="text-sm font-semibold text-slate-800 truncate px-2">
              Todo list
            </span>
            <div className="w-10 shrink-0" aria-hidden />
          </div>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
            <TopicTodoView
              topic={{
                id: selectedTopic3D._id,
                code: selectedTopic3D.topicKey,
                title: selectedTopic3D.title,
              }}
              projectId={projectId}
              hideAddTodo
            />
          </div>
        </div>
      );
    }

    const snapshotCount =
      selectedTopic3D.snapshots && selectedTopic3D.snapshots.length > 0
        ? selectedTopic3D.snapshots.length
        : selectedTopic3D.thumbnailUrl
          ? 0
          : 0;
    const renderTopicItem = (topic: TopicItem) => (
      <div
        key={topic._id}
        className="bg-white p-3 mb-[2px] cursor-pointer hover:bg-blue-50 transition-colors border-l-4 border-transparent hover:border-blue-500"
        onClick={() => openTopicDetail(topic)}
      >
        <div className="flex items-start gap-3">
          <div className="w-16 h-12 bg-slate-200 rounded overflow-hidden border">
            {topic.thumbnailUrl ? (
              <img src={topic.thumbnailUrl} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-slate-400">No Image</span>
            )}
          </div>

          <div className="flex flex-col flex-1">
            <div className="text-xs text-slate-500">{topic.topicKey}</div>
            <div className="font-semibold text-sm text-slate-800">
              {topic.title}
            </div>

            <div className="text-[11px] text-slate-500 mt-1">
              Created by: {topic.createdBy?.fullName || "Unknown"}
            </div>

            <div className="flex gap-3 mt-2 text-[11px]">
              <span>{topic.priority}</span>
              <span>{topic.status}</span>
              <span>{topic.type}</span>
            </div>
          </div>
        </div>
      </div>
    );
    return (
      <div className="flex flex-col flex-1 bg-white h-full relative">
        {/* Thanh công cụ */}
        <div className="flex items-center justify-between p-3 border-b border-slate-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setView("list");
              setSelectedTopic3D(null);
              setDetailSubview("main");
            }}
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="flex items-center gap-1 text-slate-500">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleEditTopicClick}
              title="Edit topic"
              aria-label="Edit topic"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="See Todo List"
              aria-label="See Todo List"
              onClick={() => setDetailSubview("todos")}
            >
              <ListTodo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Link todos to topic"
              aria-label="Link todos to topic"
              onClick={() => {
                setSelectedTodoIds(new Set());
                setTodoLinkSearch("");
                setAddTodosOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDeleteTopic}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {/* <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button> */}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          {/* Header: Title & Description */}
          <div className="p-4 border-b border-slate-200">
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">
              {selectedTopic3D.topicKey}
            </div>
            <h2 className="text-xl font-semibold text-slate-800 leading-tight">
              {selectedTopic3D.title}
            </h2>
            {selectedTopic3D.description && (
              <p className="text-sm text-slate-600 mt-1">
                {selectedTopic3D.description}
              </p>
            )}
          </div>

          {/* Coordination Section */}
          <div className="border-b border-slate-200">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
              onClick={() => setIsCoordinationExpanded(!isCoordinationExpanded)}
            >
              <span className="font-semibold text-slate-800 text-sm">
                Coordination
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform ${isCoordinationExpanded ? "rotate-180" : ""}`}
              />
            </div>

            {isCoordinationExpanded && (
              <div className="px-4 pb-4">
                <div className="mb-4">
                  <div className="text-[11px] text-slate-500 mb-1">Author</div>
                  <div className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded inline-block border border-slate-200">
                    {selectedTopic3D.createdBy?.fullName}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center text-xs text-slate-600 gap-2">
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        selectedTopic3D.priority === "High" ||
                        selectedTopic3D.priority === "Critical"
                          ? "text-red-500 fill-red-500"
                          : selectedTopic3D.priority === "Low"
                            ? "text-green-600 fill-green-600"
                            : "text-blue-500 fill-blue-500"
                      }`}
                    />
                    {selectedTopic3D.priority || "Normal"}
                  </div>
                  <div className="flex items-center text-xs text-slate-600 gap-2">
                    <Circle
                      className={`w-3 h-3 ${
                        selectedTopic3D.status === "New"
                          ? "text-blue-500 fill-blue-500"
                          : selectedTopic3D.status === "Done" ||
                              selectedTopic3D.status === "Closed"
                            ? "text-green-500 fill-green-500"
                            : "text-yellow-500 fill-yellow-500"
                      }`}
                    />
                    {selectedTopic3D.status || "New"}
                  </div>
                  <div className="flex items-center text-xs text-slate-600 gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    {selectedTopic3D.type || "Undefined"}
                  </div>
                </div>

                <div className="mt-4 text-[11px] text-slate-500 space-y-1">
                  <div>Created {formatDate(selectedTopic3D.createdAt)}</div>
                  {selectedTopic3D.updatedAt && selectedTopic3D.updatedBy && (
                    <div>
                      Modified {formatDate(selectedTopic3D.updatedAt)} By{" "}
                      <span className="font-medium text-slate-700">
                        {selectedTopic3D.updatedBy.fullName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b border-slate-200">
            <button
              className={`flex-1 flex justify-center py-3 text-sm transition-colors ${activeDetailTab === "views" ? "text-[#005a9e] border-b-2 border-[#005a9e] font-semibold" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setActiveDetailTab("views")}
            >
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> {snapshotCount}
              </span>
            </button>
            <button
              className={`flex-1 flex justify-center py-3 text-sm transition-colors ${activeDetailTab === "comments" ? "text-[#005a9e] border-b-2 border-[#005a9e] font-semibold" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setActiveDetailTab("comments")}
            >
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                {totalComments || 0}
              </span>
            </button>
            <button
              className={`flex-1 flex justify-center py-3 text-sm transition-colors ${activeDetailTab === "files" ? "text-[#005a9e] border-b-2 border-[#005a9e] font-semibold" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setActiveDetailTab("files")}
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />{" "}
                {selectedTopic3D.references?.length || 0}
              </span>
            </button>
            {/* <button
              className={`flex-1 flex justify-center py-3 text-sm transition-colors ${activeDetailTab === "models" ? "text-[#005a9e] border-b-2 border-[#005a9e] font-semibold" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setActiveDetailTab("models")}
            >
              <Box className="w-4 h-4" />
            </button> */}
          </div>

          {/* Tab Nội dung (Views) */}
          {activeDetailTab === "views" && (
            <div className="p-4">
              {/* HEADER */}
              <div className="flex justify-between items-center mb-3">
                <div className="text-[11px] font-bold text-slate-500 tracking-widest">
                  VIEW
                </div>

                {(selectedTopic3D.snapshots?.length ?? 0) > 0 && (
                  <button
                    className="text-xs text-red-500 hover:underline"
                    onClick={() => {
                      if (confirm("Delete all snapshots?")) {
                        deleteAllSnapshotsMutation.mutate(selectedTopic3D._id);
                      }
                    }}
                  >
                    Delete all
                  </button>
                )}
              </div>

              {/* GRID */}
              <div className="grid grid-cols-3 gap-2" key={selectedTopic3D._id}>
                {selectedTopic3D.snapshots &&
                (selectedTopic3D.snapshots?.length ?? 0) > 0 ? (
                  selectedTopic3D.snapshots.map((snap: any, index: number) => {
                    const isActive = index === activeSnapshotIndex;

                    return (
                      <div
                        key={snap._id || index}
                        className={`aspect-square border-[3px] rounded bg-slate-100 flex justify-center items-center overflow-hidden cursor-pointer relative group transition-colors ${
                          isActive
                            ? "border-[#005a9e]"
                            : "border-transparent hover:border-slate-300"
                        }`}
                        // onClick={() => {
                        //   setActiveSnapshotIndex(index);
                        //   if (onRestoreView && snap.viewState) {
                        //     setTimeout(() => {
                        //       // onRestoreView(snap.viewState, snap.items || []);
                        //       onRestoreView(
                        //         snap.viewState,
                        //         (snap.items || []).map((group: any) => ({
                        //           fileUrl: group.fileUrl,
                        //           modelID: group.modelId,
                        //           expressId: group.expressId?.map((id: any) => Number(id)) || []
                        //         }))
                        //       );
                        //     }, 200);
                        //   }
                        // }}
                      onClick={() => {
                        setActiveSnapshotIndex(index);
                        if (snap.viewState) {
                          restoreTopicView(
                            {
                              ...snap.viewState,
                              camera:
                                snap.viewState.camera ||
                                selectedTopic3D?.viewState?.camera,
                            },
                            snap.items,
                            snap.viewState?.selection,
                            selectedTopic3D?.items,
                            selectedTopic3D?.viewState?.selection,
                          );
                        }
                      }}

                      >
                        {/* IMAGE */}
                        {snap.thumbnailUrl ? (
                          <img
                            src={snap.thumbnailUrl}
                            alt={`view-${index}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            No Image
                          </span>
                        )}

                        {/* ❌ DELETE BUTTON */}
                        <button
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSnapshotMutation.mutate({
                              topicId: selectedTopic3D._id,
                              snapshotId: snap._id,
                            });
                          }}
                        >
                          ✕
                        </button>

                        {/* ▶️ OVERLAY */}
                        {!isActive && (
                          <div className="absolute inset-0 bg-black/10 hidden group-hover:flex items-center justify-center">
                            <Play className="w-6 h-6 text-white opacity-90 fill-white" />
                          </div>
                        )}

                        {/* ACTIVE LABEL */}
                        {isActive && (
                          <div className="absolute bottom-1 left-1 text-[10px] bg-blue-600 text-white px-1 rounded">
                            Active
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center text-sm text-slate-500 py-4">
                    No views available. Click the camera button to capture.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Nội dung (Comments) */}
          {activeDetailTab === "comments" && (
            <div className="flex flex-col h-full bg-white relative pb-16">
              {/* Danh sách comment có khả năng cuộn */}
              <div className="flex-1 overflow-y-auto">
                <CommentList
                  comments={comments}
                  totalComments={totalComments}
                  isLoading={isCommentsLoading}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                  currentUserId={currentUserId}
                  onUpdate={updateComment}
                  onDelete={deleteComment}
                />
              </div>

              {/* Khung nhập comment cố định dưới cùng */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10">
                <CommentInput
                  value={commentInput}
                  onChange={setCommentInput}
                  onSend={addComment}
                  isSending={isAddingComment}
                />
              </div>
            </div>
          )}

          {/* Tab Nội dung (Files/References) */}
          {activeDetailTab === "files" && (
            <div className="p-0">
              <div className="flex items-center justify-between p-4 pb-2">
                <div className="text-[11px] font-bold text-slate-500 tracking-widest">
                  REFERENCES
                </div>

                {/* MENU CHO TOÀN BỘ FILES (Download All / Remove All) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-slate-500 hover:text-slate-800 outline-none">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={handleDownloadAllReferences}
                      className="cursor-pointer"
                    >
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleRemoveAllReferences}
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      Remove all
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-col">
                {selectedTopic3D.references &&
                selectedTopic3D.references.length > 0 ? (
                  selectedTopic3D.references.map((file: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-slate-400" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">
                            {file.name || "Unknown File"}
                          </span>
                          <span className="text-xs text-slate-500">
                            v.{file.currentVersion || 1}
                          </span>
                        </div>
                      </div>

                      {/* MENU CHO TỪNG FILE CỤ THỂ */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-slate-400 hover:text-slate-700 outline-none">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleViewReference(file)}
                            className="cursor-pointer"
                          >
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownloadReference(file)}
                            className="cursor-pointer"
                          >
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleLocateInExplorer(file)}
                            className="cursor-pointer"
                          >
                            Locate in Explorer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemoveReference(file._id)}
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-slate-500 py-8">
                    No references attached.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Nội dung (Models / Coordination) */}
          {activeDetailTab === "models" &&
            (() => {
              // 1. TÍNH TOÁN TỔNG SỐ VẬT THỂ ĐÃ LINK (Đếm tất cả expressId trong các model)
              const linkedCount =
                selectedTopic3D.items?.reduce(
                  (acc: number, item: any) =>
                    acc + (item.expressId?.length || 0),
                  0,
                ) ||
                selectedTopic3D.viewState?.selection?.length ||
                0;

              return (
                <div className="p-4">
                  {/* SECTION 1: MARKER */}
                  <div className="mb-6">
                    {/* Tiêu đề & Nút 3 chấm (Chỉ hiện khi đã có Marker) */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[13px] font-semibold text-slate-700">
                        Marker
                      </h3>

                      {selectedTopic3D.viewState?.marker && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-slate-400 hover:text-slate-700 outline-none">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                              onClick={() => {
                                // Logic Xóa Marker
                                const updatedViewState = {
                                  ...selectedTopic3D.viewState,
                                };
                                delete updatedViewState.marker;

                                editInfoMutation.mutate({
                                  id: selectedTopic3D._id,
                                  payload: { viewState: updatedViewState },
                                });
                                restoreTopicView(
                                  updatedViewState,
                                  selectedTopic3D.items,
                                  selectedTopic3D.viewState?.selection,
                                );
                              }}
                            >
                              Remove marker
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* NỘI DUNG MARKER (TÙY TRẠNG THÁI) */}
                    {selectedTopic3D.viewState?.marker ? (
                      // Trạng thái 1: ĐÃ CÓ MARKER (Hiện tọa độ XYZ)
                      <div className="flex items-center gap-3 text-sm text-slate-600 mt-2">
                        <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-[11px] shadow-sm">
                          !
                        </div>
                        <span className="text-[13px]">
                          | X{" "}
                          {selectedTopic3D.viewState.marker.x?.toFixed(0) || 0}{" "}
                          mm | Y{" "}
                          {selectedTopic3D.viewState.marker.y?.toFixed(0) || 0}{" "}
                          mm | Z{" "}
                          {selectedTopic3D.viewState.marker.z?.toFixed(0) || 0}{" "}
                          mm
                        </span>
                      </div>
                    ) : (
                      // Trạng thái 2 & 3: CHƯA CÓ MARKER (Hiện Text và Nút Add/Cancel)
                      <div className="flex flex-col gap-2 mt-1">
                        <p className="text-[13px] text-slate-600 leading-relaxed mb-1">
                          Link this topic to a specific location in the model by
                          adding a marker.
                        </p>

                        {isAddingMarker ? (
                          <Button
                            variant="secondary"
                            className="w-full bg-[#c2c5c9] hover:bg-[#b0b3b8] text-slate-800 font-medium h-9"
                            onClick={() => {
                              setIsAddingMarker(false);
                              if (onAddMarkerCancel) onAddMarkerCancel(); // 👈 Báo cho Viewer hủy đợi click
                            }}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            className="w-full bg-[#e2e3e5] hover:bg-[#d1d2d4] text-slate-700 font-normal h-9"
                            onClick={() => {
                              setIsAddingMarker(true);

                              // 👈 GỌI HÀM NÀY ĐỂ BÁO IFCVIEWER BẬT CHẾ ĐỘ ĐỢI CLICK
                              if (onAddMarkerStart) {
                                onAddMarkerStart((point) => {
                                  // Hàm này sẽ tự động chạy khi bạn click vào mô hình 3D
                                  editInfoMutation.mutate(
                                    {
                                      id: selectedTopic3D._id,
                                      payload: {
                                        viewState: {
                                          ...selectedTopic3D.viewState,
                                          marker: point,
                                        },
                                      },
                                    },
                                    {
                                      onSuccess: () => setIsAddingMarker(false),
                                    },
                                  );
                                });
                              }
                            }}
                            disabled={editInfoMutation.isPending}
                          >
                            {editInfoMutation.isPending
                              ? "Adding..."
                              : "Add a marker"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: LINKED MODEL OBJECTS */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[13px] font-semibold text-slate-700">
                        Linked model objects ({linkedCount})
                      </h3>

                      {/* HIỆN MENU UNLINK ALL NẾU CÓ ITEM ĐƯỢC LINK */}
                      {linkedCount > 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-slate-400 hover:text-slate-700 outline-none">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to unlink all objects?",
                                  )
                                ) {
                                  editInfoMutation.mutate({
                                    id: selectedTopic3D._id,
                                    payload: {
                                      items: [],
                                      viewState: {
                                        ...selectedTopic3D.viewState,
                                        selection: [],
                                      },
                                    },
                                  });
                                }
                              }}
                            >
                              Unlink all
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <button className="text-slate-300 outline-none cursor-default">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Nút 1: View model objects (Tự động bôi sáng các vật thể đã lưu) */}
                      <Button
                        variant="secondary"
                        className="w-full bg-[#e2e3e5] hover:bg-[#d1d2d4] text-slate-700 font-normal h-9"
                        onClick={() => {
                          if (selectedTopic3D) {
                            restoreTopicView(
                              selectedTopic3D.viewState || {},
                              selectedTopic3D.items,
                              selectedTopic3D.viewState?.selection,
                            );
                          }
                        }}
                      >
                        View model objects
                      </Button>

                      <div className="flex gap-2">
                        {/* Nút 2: Link selected */}
                        <Button
                          variant="secondary"
                          className="flex-1 bg-[#e2e3e5] hover:bg-[#d1d2d4] text-slate-700 font-normal h-9"
                          onClick={async () => {
                            if (capture3DState) {
                              const { viewState } = await capture3DState();

                              // 1. Lấy danh sách cũ đã lưu và danh sách mới vừa chọn
                              const oldSelection =
                                selectedTopic3D.viewState?.selection || [];
                              const newSelection = viewState.selection || [];

                              // 2. GỘP CHUNG VÀ LỌC TRÙNG LẶP (Deduplicate)
                              const mergedMap = new Map();
                              [...oldSelection, ...newSelection].forEach(
                                (sel: any) => {
                                  // Tạo key duy nhất cho mỗi vật thể
                                  const key = `${sel.modelID}-${sel.expressID}`;
                                  mergedMap.set(key, sel);
                                },
                              );
                              // Đây là mảng selection cuối cùng (đã cộng dồn)
                              const finalSelection = Array.from(
                                mergedMap.values(),
                              );

                              // 3. GOM NHÓM THEO FILE ĐỂ ĐÚNG CHUẨN SCHEMA DB
                              const groupedItems: any[] = [];
                              finalSelection.forEach((sel: any) => {
                                let group = groupedItems.find(
                                  (g) => g.fileUrl === sel.fileUrl,
                                );
                                if (!group) {
                                  group = {
                                    fileUrl: sel.fileUrl,
                                    modelId: sel.modelID,
                                    expressId: [],
                                  };
                                  groupedItems.push(group);
                                }
                                // Thêm expressId vào mảng nếu chưa có
                                if (
                                  sel.expressID !== undefined &&
                                  !group.expressId.includes(
                                    String(sel.expressID),
                                  )
                                ) {
                                  group.expressId.push(String(sel.expressID));
                                }
                              });

                              // 4. LƯU LÊN DATABASE
                              editInfoMutation.mutate({
                                id: selectedTopic3D._id,
                                payload: {
                                  items: groupedItems,
                                  viewState: {
                                    ...selectedTopic3D.viewState,
                                    selection: finalSelection,
                                  },
                                },
                              });
                            }
                          }}
                          disabled={editInfoMutation.isPending}
                        >
                          Link selected
                        </Button>

                        {/* Nút 3: Unlink selected */}
                        <Button
                          variant="secondary"
                          className="flex-1 bg-[#e2e3e5] hover:bg-[#d1d2d4] text-slate-700 font-normal h-9"
                          onClick={() => {
                            // Làm rỗng mảng link
                            editInfoMutation.mutate({
                              id: selectedTopic3D._id,
                              payload: {
                                items: [],
                                viewState: {
                                  ...selectedTopic3D.viewState,
                                  selection: [],
                                },
                              },
                            });
                          }}
                          disabled={editInfoMutation.isPending}
                        >
                          Unlink selected
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Nút Dấu + Nổi ở dưới để Thêm File (Khi đang ở tab Files) */}
          {activeDetailTab === "files" && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
              <button
                className="bg-[#005a9e] hover:bg-blue-800 text-white rounded-full w-[52px] h-[52px] flex items-center justify-center shadow-[0_4px_12px_rgba(0,90,158,0.3)] transition-transform hover:scale-105 border-2 border-white"
                onClick={() => {
                  // Đổ danh sách file cũ vào state selectedRefs để đánh dấu Checkbox sẵn
                  const oldFileIds =
                    selectedTopic3D.references?.map((r: any) => r._id || r) ||
                    [];
                  setSelectedRefs(oldFileIds);
                  setView("references");
                }}
              >
                <Plus className="w-6 h-6" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>

        {/* Nút Chụp Ảnh Tròn ở dưới */}
        {activeDetailTab === "views" && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
            <button
              className="bg-[#005a9e] hover:bg-blue-800 text-white rounded-full w-[52px] h-[52px] flex items-center justify-center shadow-[0_4px_12px_rgba(0,90,158,0.3)] transition-transform hover:scale-105 border-2 border-white disabled:opacity-50 disabled:scale-100"
              onClick={handleCaptureNewView}
              disabled={addSnapshotMutation.isPending}
            >
              <div className="relative">
                {addSnapshotMutation.isPending ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Camera className="w-6 h-6" strokeWidth={2.5} />
                    <Plus className="w-3 h-3 absolute -bottom-1 -right-1 stroke-[4px]" />
                  </>
                )}
              </div>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderCreateView = () => (
    <div className="flex flex-col flex-1 bg-white h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold text-slate-800">New topic</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Title (Required)</label>
          <input
            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Add a title"
            value={formData.title}
            onKeyDown={stopViewerHotkeys}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Description</label>
          <textarea
            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm h-20 resize-none focus:outline-none focus:border-blue-500"
            placeholder="Add a description"
            value={formData.description}
            onKeyDown={stopViewerHotkeys}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Assignee</label>
          <input
            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Please enter users, groups"
            value={formData.assignee}
            onKeyDown={stopViewerHotkeys}
            onChange={(e) =>
              setFormData({ ...formData, assignee: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Type</label>
          <select
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
            value={formData.type}
            onKeyDown={stopViewerHotkeys}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as any })
            }
          >
            <option>Select type</option>
            <option value="Undefined">Undefined</option>
            <option value="Comment">Comment</option>
            <option value="Issue">Issue</option>
            <option value="Request">Request</option>
            <option value="Fault">Fault</option>
            <option value="Inquiry">Inquiry</option>
            <option value="Solution">Solution</option>
            <option value="Remark">Remark</option>
            <option value="Clash">Clash</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Priority</label>
          <select
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
            value={formData.priority}
            onKeyDown={stopViewerHotkeys}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value as any })
            }
          >
            <option>Select priority</option>
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Due date</label>
          <input
            type="date"
            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            value={formData.dueDate ? formData.dueDate.split("T")[0] : ""}
            onKeyDown={stopViewerHotkeys}
            onChange={(e) =>
              setFormData({
                ...formData,
                dueDate: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Tags</label>
          <input
            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Begin typing to search..."
            onKeyDown={stopViewerHotkeys}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Status</label>
          <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
            <option>Select status</option>
            <option value="New">New</option>
            <option value="Inprogress">In Progress</option>
            <option value="Waiting">Waiting</option>
            <option value="Done">Done</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div className="pt-2">
          <button
            onClick={() => setView("references")}
            className="text-[#005a9e] hover:text-blue-800 text-sm font-semibold flex items-center"
          >
            Add references
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-border flex justify-end gap-4 bg-white mt-auto">
        <button
          onClick={() => setView("list")}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          Cancel
        </button>
        <button
          className="bg-[#005a9e] hover:bg-blue-800 text-white text-sm font-semibold py-1.5 px-4 rounded"
          onClick={handleCreateSubmit}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Saving..." : "Save"}
          {/* Save */}
        </button>
      </div>
    </div>
  );

  const renderEditView = () => (
    <div className="flex flex-col flex-1 bg-white h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold text-slate-800">Edit topic</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Title (Required)</label>
          <input
            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Add a title"
            value={formData.title}
            onKeyDown={stopViewerHotkeys}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Description</label>
          <textarea
            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm h-20 resize-none focus:outline-none focus:border-blue-500"
            placeholder="Add a description"
            value={formData.description}
            onKeyDown={stopViewerHotkeys}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Assignee</label>
          <input
            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Please enter users, groups"
            value={formData.assignee}
            onKeyDown={stopViewerHotkeys}
            onChange={(e) =>
              setFormData({ ...formData, assignee: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Type</label>
          <select
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
            value={formData.type}
            onKeyDown={stopViewerHotkeys}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as any })
            }
          >
            <option>Select type</option>
            <option value="Undefined">Undefined</option>
            <option value="Comment">Comment</option>
            <option value="Issue">Issue</option>
            <option value="Request">Request</option>
            <option value="Fault">Fault</option>
            <option value="Inquiry">Inquiry</option>
            <option value="Solution">Solution</option>
            <option value="Remark">Remark</option>
            <option value="Clash">Clash</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Priority</label>
          <select
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
            value={formData.priority}
            onKeyDown={stopViewerHotkeys}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value as any })
            }
          >
            <option>Select priority</option>
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Due date</label>
          <input
            type="date"
            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            value={formData.dueDate ? formData.dueDate.split("T")[0] : ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                dueDate: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Tags</label>
          <input
            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Begin typing to search..."
            onKeyDown={stopViewerHotkeys}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Status</label>
          <select
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
            value={formData.status ?? "New"}
            onKeyDown={stopViewerHotkeys}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as TopicItem["status"],
              })
            }
          >
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting">Waiting</option>
            <option value="Done" disabled={blockingTodoCount > 0}>
              Done
            </option>
            <option value="Closed" disabled={blockingTodoCount > 0}>
              Closed
            </option>
          </select>
          {blockingTodoCount > 0 ? (
            <p className="text-xs text-amber-700">
              {blockingTodoCount} linked todo(s) still open — complete or cancel
              them before Done/Closed.
            </p>
          ) : null}
        </div>
        <div className="pt-2">
          <button
            onClick={() => setView("references")}
            className="text-[#005a9e] hover:text-blue-800 text-sm font-semibold flex items-center"
          >
            Add references
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-border flex justify-end gap-4 bg-white mt-auto">
        {/* Nút Cancel quay về detail */}
        <button
          onClick={() => setView("detail")}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          Cancel
        </button>
        {/* Nút Save gọi handleEditSubmit */}
        <button
          className="bg-[#005a9e] hover:bg-blue-800 text-white text-sm font-semibold py-1.5 px-4 rounded disabled:opacity-50"
          onClick={handleEditSubmit}
          disabled={editInfoMutation.isPending}
        >
          {editInfoMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );

  const renderReferencesView = () => (
    <div className="flex flex-col flex-1 bg-[#f8f9fa] h-full">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Add references</h2>
        <button
          onClick={() => setView("create")}
          className="text-slate-500 hover:text-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex border-b border-slate-300 px-4">
        <div className="pb-2 border-b-2 border-[#005a9e] px-4 cursor-pointer text-[#005a9e]">
          <FolderSearch className="h-5 w-5" />
        </div>
        <div className="pb-2 px-4 cursor-pointer text-slate-400 hover:text-slate-600">
          <Box className="h-5 w-5" />
        </div>
        <div className="pb-2 px-4 cursor-pointer text-slate-400 hover:text-slate-600">
          <LinkIcon className="h-5 w-5" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs text-slate-500 mb-4">
          You can select more than one file at a time.
        </p>

        {/* Nút lùi lại thư mục cha */}
        {currentFolderId && (
          <div
            onClick={handleBackFolder}
            className="cursor-pointer text-blue-600 hover:text-blue-800 mb-3 flex items-center gap-1 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to parent folder
          </div>
        )}

        {isExplorerLoading ? (
          <div className="text-center text-sm text-slate-500 py-4">
            Loading contents...
          </div>
        ) : (
          <>
            {/* DANH SÁCH FOLDER THẬT */}
            <div className="mt-2 space-y-1">
              {explorerData?.subFolders?.map((folder: any) => (
                <div
                  key={folder._id}
                  onClick={() => handleFolderClick(folder._id)}
                  className="flex items-center justify-between py-1.5 pl-2 hover:bg-slate-200 cursor-pointer rounded"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-slate-500 fill-slate-500" />
                    <span className="text-sm text-slate-700">
                      {folder.name}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              ))}
            </div>

            {/* DANH SÁCH FILE THẬT */}
            <div className="mt-2 space-y-1">
              {explorerData?.files?.map((file: any) => (
                <div
                  key={file._id}
                  className="flex items-center gap-3 py-1.5 pl-2 hover:bg-slate-200 cursor-pointer rounded"
                  onClick={() => toggleFileSelection(file._id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedRefs.includes(file._id)}
                    readOnly
                    className="w-4 h-4 rounded border-slate-300 text-[#005a9e] focus:ring-[#005a9e]"
                  />
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700 truncate">
                    {file.name}
                  </span>
                </div>
              ))}

              {/* Thông báo nếu thư mục rỗng */}
              {explorerData?.files?.length === 0 &&
                explorerData?.subFolders?.length === 0 && (
                  <div className="text-sm text-slate-500 italic mt-4 text-center">
                    This folder is empty
                  </div>
                )}
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t border-slate-300 flex justify-end gap-4 bg-[#f8f9fa] mt-auto">
        <button
          onClick={() => setView(selectedTopic3D ? "detail" : "create")}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          Cancel
        </button>
        <button
          onClick={handleAddReferencesSubmit}
          disabled={editInfoMutation.isPending}
          className="bg-[#005a9e] hover:bg-blue-800 text-white text-sm font-semibold py-1.5 px-4 rounded"
        >
          {editInfoMutation.isPending
            ? "Saving..."
            : `Add ${selectedRefs.length > 0 ? `(${selectedRefs.length})` : ""} references`}
        </button>
      </div>
    </div>
  );

  return (
    <aside className="w-full bg-background flex flex-col min-h-full overflow-hidden">
      {view === "list" && (
        <>
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Topics</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  // variant="ghost"
                  // size="icon"
                  // className="h-8 w-8 cursor-pointer"
                  onClick={() => setView("create")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy("date-created")}>
                      Date created{" "}
                      {sortBy === "date-created" && (
                        <Check className="ml-2 h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("name")}>
                      Name{" "}
                      {sortBy === "name" && <Check className="ml-2 h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortBy("date-modified")}
                    >
                      Date modified{" "}
                      {sortBy === "date-modified" && (
                        <Check className="ml-2 h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {showSearch && (
              <div className="mb-3">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}
            <div className="w-fit">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-8 px-2 text-sm font-normal"
                  >
                    {statusFilter || "All Topics in project"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuItem onClick={() => setStatusFilter(undefined)}>
                    All Topics in project
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("Active Topics")}
                  >
                    Active Topics
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("Assigned to me")}
                  >
                    Assigned to me
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("Created by me")}
                  >
                    Created by me
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("From this models")}
                  >
                    From this models
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Group By Filter */}
          <div className="px-4 py-2 border-b border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-sm font-normal text-muted-foreground hover:text-foreground"
                >
                  Group by:{" "}
                  {groupBy === "none"
                    ? "No grouping"
                    : groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
                  <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setGroupBy("none")}>
                  No grouping{" "}
                  {groupBy === "none" && <Check className="ml-2 h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("status")}>
                  Status{" "}
                  {groupBy === "status" && <Check className="ml-2 h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("assignee")}>
                  Assignee{" "}
                  {groupBy === "assignee" && <Check className="ml-2 h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("priority")}>
                  Priority{" "}
                  {groupBy === "priority" && <Check className="ml-2 h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* View List Area */}
          <div className="flex flex-col overflow-y-auto bg-slate-100 flex-1">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">
                Loading topics...
              </div>
            ) : topics.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No topics found.
              </div>
            ) : (
              openTopics.map((topic: TopicItem) => (
                <div
                  key={topic._id}
                  className="bg-white p-3 mb-[2px] cursor-pointer hover:bg-blue-50 transition-colors border-l-4 border-transparent hover:border-blue-500"
                  // Thêm sự kiện onClick để xem chi tiết / Zoom 3D sau này
                  // onClick={() => {
                  //   setSelectedTopic3D(topic);
                  //   setActiveSnapshotIndex(0); 
                  //   setView("detail");

                  //   if (onRestoreView && topic.viewState) {
                  //     onRestoreView(topic.viewState, topic.items || []);
                  //   }
                  // }}
                onClick={() => openTopicDetail(topic)}

                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-12 bg-slate-200 rounded flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                      {topic.thumbnailUrl ? (
                        <img
                          src={topic.thumbnailUrl}
                          alt="thumb"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          No Image
                        </span>
                      )}
                    </div>

                    {/* Thông tin Text */}
                    <div className="flex flex-col flex-1">
                      <div className="text-xs text-slate-500 font-medium">
                        {topic.topicKey}
                      </div>
                      <div className="font-semibold text-sm text-slate-800 leading-tight mt-0.5">
                        {topic.title}
                      </div>

                      {/* Backend đang populate createdBy nên nó là một object chứa fullName */}
                      <div className="text-[11px] text-slate-500 mt-1">
                        Created by: {topic.createdBy?.fullName || "Unknown"}
                      </div>

                      {/* Các Badges: Priority, Status, Type */}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {/* Priority */}
                        <span className="flex items-center text-[11px] text-slate-600 gap-1 font-medium">
                          <Bookmark
                            className={`w-3 h-3 ${
                              topic.priority === "High" ||
                              topic.priority === "Critical"
                                ? "text-red-500 fill-red-500"
                                : topic.priority === "Low"
                                  ? "text-green-600 fill-green-600"
                                  : "text-blue-500 fill-blue-500"
                            }`}
                          />
                          {topic.priority}
                        </span>

                        {/* Status */}
                        <span className="flex items-center text-[11px] text-slate-600 gap-1 font-medium">
                          <Circle
                            className={`w-2.5 h-2.5 ${
                              topic.status === "New"
                                ? "text-blue-500 fill-blue-500"
                                : topic.status === "Done" ||
                                    topic.status === "Closed"
                                  ? "text-green-500 fill-green-500"
                                  : "text-yellow-500 fill-yellow-500"
                            }`}
                          />
                          {topic.status}
                        </span>

                        {/* Type */}
                        <span className="flex items-center text-[11px] text-slate-600 gap-1 font-medium">
                          <AlertCircle className="w-3 h-3 text-red-500 fill-red-500" />
                          {topic.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* <NewTodoDrawer
                    open={isDrawerOpen}
                    onOpenChange={setIsDrawerOpen}
                    projectId={projectId}
                    todoToEdit={todoToEdit}
                    mode={drawerMode}
                /> */}
        </>
      )}
      {view === "detail" && renderDetailView()}
      {view === "create" && renderCreateView()}
      {view === "edit" && renderEditView()}
      {view === "references" && renderReferencesView()}

      <Dialog
        open={addTodosOpen}
        onOpenChange={(open) => {
          setAddTodosOpen(open);
          if (!open) {
            setSelectedTodoIds(new Set());
            setTodoLinkSearch("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link todos to this topic</DialogTitle>
            <DialogDescription>
              Choose one or more project todos to associate with this topic.
              Todos already linked here are not listed. Todos linked to another
              topic can be moved here.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Search by title or status…"
            value={todoLinkSearch}
            onKeyDown={stopViewerHotkeys}
            onChange={(e) => setTodoLinkSearch(e.target.value)}
            className="mb-2"
          />
          <ScrollArea className="h-[280px] rounded-md border p-2">
            {projectTodosLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-500 gap-2 text-sm">
                <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                Loading todos…
              </div>
            ) : linkableTodos.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8 px-2">
                No todos available to link. All project todos may already be
                linked to this topic.
              </p>
            ) : (
              <div className="space-y-2 pr-2">
                {linkableTodos.map((t) => (
                  <label
                    key={t._id}
                    className="flex items-start gap-3 rounded-md border border-slate-100 p-2 hover:bg-slate-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedTodoIds.has(t._id)}
                      onCheckedChange={() => toggleTodoLinkSelection(t._id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {t.title}
                      </div>
                      <div className="text-xs text-slate-500 capitalize">
                        {String(t.status || "").replace(/_/g, " ")}
                        {(() => {
                          const linkedId = getTodoLinkedTopicItemId(t);
                          if (
                            !linkedId ||
                            linkedId === String(selectedTopic3D?._id)
                          ) {
                            return null;
                          }
                          const label =
                            topicDisplayById.get(linkedId) ??
                            `Topic ${linkedId.slice(0, 8)}…`;
                          return (
                            <span className="text-amber-700 font-normal ml-1">
                              · Linked: {label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-between gap-2 text-xs text-slate-500 pt-1">
            <button
              type="button"
              className="underline hover:text-slate-800 disabled:opacity-40"
              disabled={linkableTodos.length === 0}
              onClick={() =>
                setSelectedTodoIds(new Set(linkableTodos.map((x) => x._id)))
              }
            >
              Select all
            </button>
            <button
              type="button"
              className="underline hover:text-slate-800"
              onClick={() => setSelectedTodoIds(new Set())}
            >
              Clear
            </button>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddTodosOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#005F9E] hover:bg-[#004B7D] text-white"
              disabled={
                selectedTodoIds.size === 0 ||
                linkTodosToTopicMutation.isPending
              }
              onClick={() =>
                linkTodosToTopicMutation.mutate(Array.from(selectedTodoIds))
              }
            >
              {linkTodosToTopicMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                  Adding…
                </>
              ) : (
                `Add${selectedTodoIds.size ? ` (${selectedTodoIds.size})` : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
