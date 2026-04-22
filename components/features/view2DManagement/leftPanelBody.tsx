"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";

import FileDetailTab from "./tabView2D/detailTab";
import TodosTab from "./tabView2D/todoTab";
import ViewsTab from "./tabView2D/viewTab";

import { ViewItem, TodoItem, PageItem, IFile } from "@/types/explorer";
import { View2DItem } from "@/types/view2d";
import VersionHistoryPanel from "./tabView2D/VersionHistoryPanel";

const PagesTab = dynamic(() => import("./tabView2D/pageTab"), { ssr: false });

type ActiveTab = "filedetail" | "page" | "view" | "todo" | "history";

type LeftPanelBodyProps = {
  activeTab: ActiveTab;
  allowedKeys: ActiveTab[];
  // 🌟 Thêm currentUser để nhận tên người dùng động từ viewHome truyền xuống
  currentUser?: string;
  data: {
    file: IFile | null;
    view?: View2DItem | null;
    pages: PageItem[];
    pageIndex: number;
    views: View2DItem[];
    todos: TodoItem[];
    projectId?: string;
  };
  onSelectPage: (item: PageItem) => void;
  onSelectView: (view: View2DItem) => void;
  onSelectTodo: (todo: TodoItem) => void;
  onCreateView: () => void;
  onCreateTodo: () => void;
  onDeleteView?: (id: string) => void;
  onDeleteTodo?: (id: string) => void;
  onEditView?: (view: View2DItem) => void;

  onOpenVersion?: (version: any) => void;
  /** Highlights the revision currently shown in the main viewer (if any). */
  activeViewerVersion?: number | null;
  onDownloadVersion?: (version: any) => void;
  onCloseHistory?: () => void;
  onFileUpdated?: (file: IFile) => void;
};

export default function LeftPanelBody(props: LeftPanelBodyProps) {
  const {
    activeTab,
    data,
    currentUser = "Unknown User", // Fallback an toàn nếu không truyền
    onSelectPage,
    onSelectView,
    onSelectTodo,
    onCreateView,
    onCreateTodo,
    onDeleteView,
    onDeleteTodo,
    onEditView,
    onOpenVersion,
    activeViewerVersion,
    onDownloadVersion,
    onCloseHistory,
  } = props;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 12 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="h-full"
      >
        {activeTab === "filedetail" && (
          <FileDetailTab
            file={data.file}
            view={data.view ?? null}
            onUpdateSuccess={props.onFileUpdated}
            onOpenVersionInViewer={onOpenVersion}
            activeViewerVersion={activeViewerVersion}
          />
        )}

        {activeTab === "history" && (
          <VersionHistoryPanel
            file={data.file}
            activeViewerVersion={activeViewerVersion}
            onClose={() => onCloseHistory?.()}
            onOpenVersion={onOpenVersion}
            onDownloadVersion={
              onDownloadVersion ||
              ((ver) => {
                if (ver.location) window.open(ver.location, "_blank");
              })
            }
          />
        )}

        {activeTab === "page" && (
          <PagesTab
            pages={data.pages}
            currentPageIndex={data.pageIndex}
            onSelectPage={onSelectPage}
            pdfUrl={data.file?.fileUrl}
          />
        )}

        {activeTab === "view" && (
          <ViewsTab
            views={data.views}
            currentUser={currentUser}
            onSelectView={onSelectView}
            onCreateView={onCreateView}
            onDeleteView={onDeleteView}
            onEditView={onEditView}
          />
        )}

        {activeTab === "todo" && (
          <TodosTab
            todos={data.todos}
            projectId={data.projectId}
            // 🌟 Sử dụng biến currentUser động
            currentUser={currentUser}
            onSelectTodo={onSelectTodo}
            onCreateTodo={onCreateTodo}
            onDeleteTodo={onDeleteTodo}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
