'use client';

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import IfcViewer from '@/app/components/ifcs/IfcViewer';
import { Box, Layers, ClipboardCheck, ChevronRight, ChevronLeft, Camera, FolderTree, Sheet, BadgeInfo, BookText } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar/Navbar';
import { NewTodoDrawer } from '@/components/todos/NewTodoDrawer';

interface SelectedItem {
  modelID?: string;
  fileUrl?: string;
  expressID?: string;
}

interface NewTodoInitialData {
  items?: {
    fileUrl: string;
    modelId: string;
    expressId: string[];
  }[];
  title?: string;
}

// Helper so sánh 2 mảng URL xem có giống hệt nhau không
const areArraysEqual = (arr1: string[], arr2: string[]) => {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((value, index) => value === sorted2[index]);
};

export default function ViewerClient() {
  const router = useRouter();
  const { projectId } = useParams()
  const searchParams = useSearchParams();

  const [state, setState] = React.useState('models');
  const [ifcUrls, setIfcUrls] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerInitialData, setDrawerInitialData] = useState<NewTodoInitialData | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [pendingTodo, setPendingTodo] = useState<any>(null);
  // const viewerActions = React.useRef<any>(null);
  const viewerActions = React.useRef<{ capture: () => any; restore: (state: any, items: any[]) => void } | null>(null);

  // const captureViewRef = React.useRef<() => any>(null);
  const ctaBtn = [
    { icon: <Box />, label: 'models' },
    { icon: <Layers />, label: 'layers' },
    { icon: <ClipboardCheck />, label: 'todos' },
    { icon: <Camera />, label: 'views' },
    { icon: <FolderTree />, label: 'organizer' },
    { icon: <Sheet />, label: 'data-table' },
    { icon: <BookText />, label: 'topics' },
    { icon: <BadgeInfo />, label: 'clash-sets' },
  ];

  const handleRegisterActions = (actions: any) => {
    viewerActions.current = actions;
  };

  useEffect(() => {
    const rawParams = searchParams.get('urls');
    const storageKey = `bimcde_active_models_${projectId}`; // Key riêng theo project

    if (rawParams) {
      // TRƯỜNG HỢP A: Có params trên URL (Click từ Todo hoặc Link chia sẻ)
      try {
        const parsed = JSON.parse(decodeURIComponent(rawParams));

        // Cập nhật State
        setIfcUrls(parsed);
        console.log("Parsed IFC URLs from params:", parsed);
        // Lưu vào Storage để dùng khi F5
        sessionStorage.setItem(storageKey, JSON.stringify(parsed));

        // Xóa URL cho đẹp (Clean URL)
        router.replace(`/projects/${projectId}/viewer3d`);
      } catch (e) {
        console.error("Error parsing URLs from params", e);
      }
    } else {
      // TRƯỜNG HỢP B: URL trống (F5 hoặc load lại trang)
      // Thử khôi phục từ Storage
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log("Parsed IFC URLs from params F5:", parsed);

          // Chỉ set lại nếu khác state hiện tại để tránh re-render vô tận
          setIfcUrls(prev => areArraysEqual(prev, parsed) ? prev : parsed);
        } catch (e) {
          console.error("Error parsing URLs from storage", e);
        }
      }
    }
  }, [searchParams, projectId, router]);

  const handleBack = () => {
    router.push(`/projects/${projectId}/data`);
  };

  const handleRefresh = () => {
    console.log("Refresh Action Clicked");
  };

  const onAddTodo = () => {
    // 1. Luôn capture View State trước tiên
    let viewState = null;
    if (viewerActions.current?.capture) {
      viewState = viewerActions.current.capture();
    }

    // 2. Chuẩn bị items (nếu có chọn)
    let items: any[] = [];
    let title = undefined;

    if (selectedItems.length > 0) {
      const grouped = new Map();
      selectedItems.forEach(item => {
        const key = `${item.fileUrl}-${item.modelID}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            fileUrl: item.fileUrl || '',
            modelId: String(item.modelID || ''),
            expressId: []
          });
        }
        grouped.get(key).expressId.push(String(item.expressID || ''));
      });
      items = Array.from(grouped.values());
      title = `Issue on ${selectedItems.length > 1 ? `${selectedItems.length} items` : `#${items[0]?.expressId[0] || ''}`}`;
    } else {
      // TRƯỜNG HỢP 2: KHÔNG CHỌN ITEM (Logic mới sửa lỗi)
      // Lấy context từ các model đang mở hiện tại (ifcUrls)
      console.log("ifcUrls: ", ifcUrls);
      if (ifcUrls.length > 0) {
        items = ifcUrls.map((url: any) => ({
          fileUrl: url,
          modelId: "", // Không có ID cụ thể vì không chọn object nào
          expressId: [] // Mảng rỗng báo hiệu là View Context, không phải object link
        }));
        //  title = "View Snapshot"; // Tiêu đề mặc định
      }
    }

    // 3. Luôn set initialData (bao gồm viewState) trước khi mở Drawer
    const initialData = {
      items,      // Mảng rỗng hoặc có data
      title,      // undefined hoặc có title
      viewState,  // <--- QUAN TRỌNG: Luôn có viewState
    };

    setDrawerInitialData(initialData);
    setIsDrawerOpen(true);
  };

  // --- LOGIC CHÍNH ĐÃ ĐƯỢC NÂNG CẤP ---
  const handleSelectTodo = (todo: any) => {
    // 1. Xác định danh sách fileUrl mà Todo này cần
    let targetUrls: string[] = [];

    if (todo.items && todo.items.length > 0) {
      // Lấy unique fileUrl từ items
      targetUrls = Array.from(new Set(todo.items.map((i: any) => i.fileUrl) as string[]));
    }

    // Nếu todo không có items (lỗi data cũ), giữ nguyên view hiện tại hoặc báo lỗi
    if (targetUrls.length === 0) {
      if (todo.viewState) {
        // Fallback: Nếu không có items nhưng có viewState, thử restore luôn trên view hiện tại
        viewerActions.current?.restore(todo.viewState, []);
      }
      return;
    }

    // 2. So sánh với danh sách URL đang load hiện tại (ifcUrls từ URL params)
    const isContextMatch = areArraysEqual(ifcUrls, targetUrls);

    if (isContextMatch) {
      // TRƯỜNG HỢP A: Đang ở Model A, click Todo Model A
      // -> KHÔNG load lại model, chỉ khôi phục góc nhìn
      console.log("Context match, restoring view only...");
      if (viewerActions.current?.restore) {
        viewerActions.current.restore(todo.viewState, todo.items);
      }
    } else {
      // TRƯỜNG HỢP B: Đang ở Model A, click Todo Model B (hoặc A+B)
      // -> Cập nhật URL trình duyệt để load model mới
      console.log("Context mismatch, switching models...", targetUrls);

      setPendingTodo(todo); // Lưu todo vào hàng đợi

      // Update Router -> Sẽ trigger useEffect trong IfcViewer
      const newUrlsParams = JSON.stringify(targetUrls);
      router.push(`/projects/${projectId}/viewer3d?urls=${encodeURIComponent(newUrlsParams)}`);
    }
  };



  // Callback khi IfcViewer load xong model
  // Callback khi IfcViewer báo đã load xong model mới
  const handleViewerLoaded = () => {
    if (pendingTodo) {
      console.log("New model loaded, restoring pending todo...");
      // Timeout nhẹ để đảm bảo scene ổn định
      setTimeout(() => {
        if (viewerActions.current?.restore) {
          viewerActions.current.restore(pendingTodo.viewState, pendingTodo.items);
        }
        setPendingTodo(null); // Clear hàng đợi
      }, 500);
    }
  };


  // useEffect(() => {
  //   if (!ifcUrls.length) return;

  //   router.replace(`/projects/${projectId}/viewer3d`, { scroll: false });
  // }, [ifcUrls, router]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Navbar
        onBack={handleBack}
        onRefresh={handleRefresh}
        onAddTodo={onAddTodo}
      />
      {/* handle navbar and extend when click item can create todo related to it */}
      <div className="flex flex-1">
        <div className="w-10 min-h-full bg-gray-200">
          <div className="mt-[150]">
            <span
              className={`flex justify-center cursor-pointer py-3 mb-2 text-black hover:bg-slate-600 hover:text-white`}
            >
              {isCollapsed ? (
                <ChevronRight
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsCollapsed(false)}
                />
              ) : (
                <ChevronLeft style={{ cursor: 'pointer' }} onClick={() => setIsCollapsed(true)} />
              )}
            </span>

            {ctaBtn.map((item, index) => {
              const isActive = state == item.label;

              return (
                <span
                  key={index}
                  className={`flex justify-center cursor-pointer py-3 mb-2 ${isActive
                    ? 'bg-slate-600 text-white'
                    : 'text-black hover:bg-slate-600 hover:text-white'
                    }`}
                  onClick={() => setState(item.label)}
                >
                  {item.icon}
                </span>
              );
            })}
          </div>
        </div>
        <div className="w-full h-full overflow-hidden">
          <IfcViewer
            setSelectdItemsForNavbar={setSelectedItems}
            isCollapsed={isCollapsed}
            ifcUrls={ifcUrls}
            state={state}
            projectId={projectId}
            onRegisterCapture={handleRegisterActions}
            onLoaded={handleViewerLoaded}
            onSelectTodo={handleSelectTodo}
          />
        </div>
      </div>

      <NewTodoDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        projectId={projectId as string}
        mode="create"
        initialData={drawerInitialData}
      />
    </div>
  );
}
