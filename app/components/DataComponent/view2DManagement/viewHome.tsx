'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import LeftPanelTool from './leftPanelTool';
import LeftPanelBody from './leftPanelBody';

import ViewDetailPanel from './tabView2D/properties2DView/viewProperties';
import TodoDetailPanel from './tabView2D/properties2DView/todoProperties';
import CreateViewPanel from './createModel/createView';
import CreateTodoPanel from './createModel/createTodo';
import FileViewport from './viewPort';

import { pdfjs } from 'react-pdf';

import {
  getView,
  getFile,
  getViews,
  getTodos,
} from '../../../types/api';

import type {
  FileItem,
  ViewItem,
  TodoItem,
  PageItem
} from '@/app/types/api';

// Config worker cho PDF
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type RightPanelState =
  | { type: 'viewDetail'; data: ViewItem }
  | { type: 'todoDetail'; data: TodoItem }
  | { type: 'createView' }
  | { type: 'createTodo' }
  | null;

type ActiveTool = 'filedetail' | 'page' | 'view' | 'todo';

/* ========= COMPONENT ========= */

export default function DetailView2D({
  mode = 'view',
  fileId,
}: {
  mode?: 'view' | 'file';
  fileId?: string;
}) {
  const params = useParams() as { id: string; viewId?: string };
  const viewId = mode === 'view' ? params.viewId : undefined;

  const [file, setFile] = useState<FileItem | null>(null);
  const [views, setViews] = useState<ViewItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedView, setSelectedView] = useState<ViewItem | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);

  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState<number>(1); 

  const [activeTool, setActiveTool] = useState<ActiveTool>(
    mode === 'file' ? 'page' : 'view'
  );

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [rightPanel, setRightPanel] = useState<RightPanelState>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [rotate, setRotate] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getPdfTotalPages = async (url: string) => {
    try {
      const loadingTask = pdfjs.getDocument(url);
      const pdf = await loadingTask.promise;
      return pdf.numPages;
    } catch (error) {
      console.error("Lỗi đếm trang PDF:", error);
      return 1;
    }
  };

  /* ===== sync active tool ===== */
  useEffect(() => {
    setActiveTool(mode === 'file' ? 'page' : 'view');
  }, [mode]);

  /* ===== LOAD DATA (INITIAL) ===== */
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        let projectId: string;
        let resolvedFileId: string;
        let fileRes: FileItem | null = null;
        let initialSrc: string | null = null;

        if (mode === 'view') {
          if (!viewId) throw new Error('Missing viewId');

          const view = await getView(viewId);
          projectId = view.projectId;
          
          // --- FIX LỖI OBJECT OBJECT TẠI ĐÂY (INITIAL LOAD) ---
          // Kiểm tra xem fileId là object (đã populate) hay string
          if (typeof view.fileId === 'object' && view.fileId !== null) {
             // Đã có dữ liệu file, không cần lấy ID nữa
             fileRes = view.fileId as unknown as FileItem;
             resolvedFileId = fileRes._id; 
          } else {
             // Chưa có dữ liệu, lấy ID để tí nữa gọi API
             resolvedFileId = view.fileId as string;
          }

          initialSrc = view.previewSrc ?? null;
        } else {
          if (!fileId) throw new Error('Missing fileId');

          fileRes = await getFile(fileId);
          projectId = fileRes.projectId;
          resolvedFileId = fileRes._id;
          initialSrc = fileRes.previewSrc ?? fileRes.fileUrl;
        }

        // Nếu fileRes chưa có (trường hợp view chưa populate), gọi API lấy
        const finalFile = fileRes ?? (await getFile(resolvedFileId));

        const [viewsRes, todosRes] = await Promise.all([
          getViews(projectId),
          getTodos(projectId),
        ]);

        setFile(finalFile);
        setViews(viewsRes);
        setTodos(todosRes);
        setCurrentSrc(initialSrc);

        /* ===== DERIVE PAGES (Logic tạo trang ban đầu) ===== */
        let derivedPages: PageItem[] = [];

        if (finalFile.fileType === 'PDF' || finalFile.fileUrl?.toLowerCase().endsWith('.pdf')) {
          const total = await getPdfTotalPages(finalFile.fileUrl);
          derivedPages = Array.from({ length: total }).map((_, i) => ({
            _id: `${finalFile._id}-page-${i + 1}`,
            index: i + 1,
            pageNumber: i + 1,
            fileId: finalFile._id,
            source: 'pdf'
          }));
        } else {
          // Mặc định cho file ảnh đơn / View
          derivedPages = [{
            _id: resolvedFileId,
            index: 1,
            imageSrc: initialSrc ?? '',
            fileId: resolvedFileId,
            source: 'file'
          }];
        }
        setPages(derivedPages);
        setPageIndex(1);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [mode, fileId, viewId]);

  /* ===== LOGIC RELOAD PAGES ===== */
  // Chỉ chạy khi chọn file khác, nhưng KHÔNG chạy khi đang xem ảnh snapshot của View
  useEffect(() => {
    if (activeTool !== 'page') return;
    // Nếu đang có view được chọn và src hiện tại là ảnh của view đó -> BỎ QUA load PDF
    if (selectedView?.previewSrc && currentSrc === selectedView.previewSrc) return;
    if (!selectedFile) return;

    async function reLoadPagesForPageTab() {
      if( 
        selectedFile?.fileType !=='PDF' && !selectedFile?.fileUrl?.toLocaleLowerCase().endsWith('.pdf')
      ) {
        setPages([
          {
            _id: selectedFile?._id,
            index: 1,
            imageSrc: currentSrc ?? '',
            fileId: selectedFile?._id
          },
        ]);
        setPageIndex(1);
        return;
      }
      
      const total = await getPdfTotalPages(selectedFile.fileUrl!);
      const derivedPages: PageItem[] = Array.from({ length: total }).map(
        (_, i) => ({
          _id: `${selectedFile._id}-page-${i + 1}`,
          index: i + 1,
          pageNumber: i + 1,
          fileId: selectedFile._id,
          source: 'pdf'
        })
      );

      setPages(derivedPages);
      setPageIndex((prev) => Math.min(prev, derivedPages.length));
    }
    reLoadPagesForPageTab();
  }, [activeTool, selectedFile]); // Bỏ selectedView ra để tránh loop, logic check ở đầu hàm

  /* ===== RENDER STATES ===== */
  if (loading) return <div className="flex h-full items-center justify-center">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  /* ===== UI ===== */
  return (
    <div className="flex h-full w-full overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
      <LeftPanelTool
        activeKey={activeTool}
        viewCount={views.length}
        onClick={(key) => {
          const tool = key as ActiveTool;
          if (tool === activeTool) setIsLeftPanelOpen(!isLeftPanelOpen);
          else {
            setActiveTool(tool);
            setIsLeftPanelOpen(true);
          }
          setRightPanel(null);
        }}
      />

      {isLeftPanelOpen && (
        <div className="w-72 border-r border-gray-300 bg-white">
          <LeftPanelBody
            activeTool={activeTool}
            data={{
              file: selectedFile || file, // Fallback về file gốc
              view: selectedView,
              pages,
              pageIndex,
              views,
              todos,
            }}
            
            // Xử lý khi chọn trang bên trái
            onSelectPage={(item: PageItem) => {
              setPageIndex(item.pageNumber ?? item.index);
              if (item.imageSrc) {
                setCurrentSrc(item.imageSrc); // Xem ảnh snapshot
              } else {
                setCurrentSrc(null); // Xem PDF gốc
              }
            }}
          
            // --- FIX LỖI [Object Object] KHI CHỌN VIEW ---
            onSelectView={async (v) => {
              setSelectedView(v);
              setSelectedTodo(null);

              let fileData: FileItem;

              // KIỂM TRA QUAN TRỌNG: fileId là Object hay String?
              if (typeof v.fileId === 'object' && v.fileId !== null) {
                 // Backend đã populate -> Dùng luôn data này, KHÔNG gọi API getFile
                 fileData = v.fileId as unknown as FileItem;
              } else {
                 // Backend trả về string ID -> Gọi API lấy thông tin file
                 fileData = await getFile(v.fileId as string);
              }

              // 1. Cập nhật thông tin file cho FileDetailTab
              setSelectedFile(fileData);

              // 2. Hiển thị ảnh snapshot của View ngay lập tức
              const snapshotSrc = v.previewSrc ?? null;
              setCurrentSrc(snapshotSrc);
              
              // 3. Cập nhật PageTab chỉ hiện 1 trang là cái view đó
              setPages([
                {
                  _id: v._id,
                  index: 1,
                  imageSrc: snapshotSrc ?? '',
                  fileId: fileData._id,
                  source: 'view'
                },
              ]);

              setPageIndex(1);
              setRightPanel({type: 'viewDetail', data: v});
            }}

            onSelectTodo={(t) => {
              setSelectedTodo(t);
              setSelectedView(null);
              setSelectedFile(null);
              if (t.relatedImage) setCurrentSrc(t.relatedImage);
              setRightPanel({ type: 'todoDetail', data: t });
            }}

            onCreateView={() => setRightPanel({ type: 'createView' })}
            onCreateTodo={() => setRightPanel({ type: 'createTodo' })}
          />
        </div>
      )}

      <FileViewport
        // Ưu tiên file của view đang chọn
        file={selectedFile || file} 
        currentSrc={currentSrc}
        pageIndex={pageIndex}
        zoom={zoom}
        rotate={rotate}
        onZoom={(d) => setZoom((z) => Math.max(0.2, Math.min(3, z + d)))}
        onRotate={(d) => setRotate((r) => (r + d) % 360)}
        onPrev={() => setPageIndex((p) => Math.max(1, p - 1))}
        onNext={() => setPageIndex((p) => Math.min(pages.length, p + 1))}
      />

      {rightPanel?.type === 'viewDetail' && <ViewDetailPanel view={rightPanel.data} onClose={() => setRightPanel(null)} />}
      {rightPanel?.type === 'todoDetail' && <TodoDetailPanel todo={rightPanel.data} onClose={() => setRightPanel(null)} />}
      {rightPanel?.type === 'createView' && <CreateViewPanel onClose={() => setRightPanel(null)} onSave={() => setRightPanel(null)} />}
      {rightPanel?.type === 'createTodo' && <CreateTodoPanel onClose={() => setRightPanel(null)} onSave={() => setRightPanel(null)} />}
    </div>
  );
}
// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams } from 'next/navigation';

// import LeftPanelTool from './leftPanelTool';
// import LeftPanelBody from './leftPanelBody';

// import ViewDetailPanel from './tabView2D/properties2DView/viewProperties';
// import TodoDetailPanel from './tabView2D/properties2DView/todoProperties';
// import CreateViewPanel from './createModel/createView';
// import CreateTodoPanel from './createModel/createTodo';
// import FileViewport from './viewPort';

// import { pdfjs } from 'react-pdf';

// import {
//   getView,
//   getFile,
//   getViews,
//   getTodos,
// } from '../../../types/api';

// import type {
//   FileItem,
//   ViewItem,
//   TodoItem,
//   PageItem
// } from '@/app/types/api';

// type RightPanelState =
//   | { type: 'viewDetail'; data: ViewItem }
//   | { type: 'todoDetail'; data: TodoItem }
//   | { type: 'createView' }
//   | { type: 'createTodo' }
//   | null;

// type ActiveTool = 'filedetail' | 'page' | 'view' | 'todo';

// /* ========= COMPONENT ========= */

// export default function DetailView2D({
//   mode = 'view',
//   fileId,
// }: {
//   mode?: 'view' | 'file';
//   fileId?: string;
// }) {
//   const params = useParams() as { id: string; viewId?: string };
//   const viewId = mode === 'view' ? params.viewId : undefined;

//   const [file, setFile] = useState<FileItem | null>(null);
//   const [views, setViews] = useState<ViewItem[]>([]);
//   const [todos, setTodos] = useState<TodoItem[]>([]);
//   const [pages, setPages] = useState<PageItem[]>([]);

//   const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
//   const [selectedView, setSelectedView] = useState<ViewItem | null>(null);
//   const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);

//   const [currentSrc, setCurrentSrc] = useState<string | null>(null);
//   const [pageIndex, setPageIndex] = useState<number>(1); 

//   // const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
//   const [pageCount, setPageCount] = useState(0);
//   const [currentPage, setCurrentPage] = useState(1);

//   const [activeTool, setActiveTool] = useState<ActiveTool>(
//     mode === 'file' ? 'page' : 'view'
//   );

//   const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
//   const [rightPanel, setRightPanel] = useState<RightPanelState>(null);

//   const [zoom, setZoom] = useState<number>(1);
//   const [rotate, setRotate] = useState<number>(0);

//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   const getPdfTotalPages = async (url: string) => {
//     try {
//       const loadingTask = pdfjs.getDocument(url);
//       const pdf = await loadingTask.promise;
//       return pdf.numPages;
//     } catch (error) {
//       console.error("Lỗi đếm trang PDF:", error);
//       return 1;
//     }
//   };
//   /* ===== sync active tool ===== */
//   useEffect(() => {
//     setActiveTool(mode === 'file' ? 'page' : 'view');
//   }, [mode]);

//   /* ===== LOAD DATA ===== */
//   useEffect(() => {
//     async function load() {
//       try {
//         setLoading(true);
//         setError(null);

//         let projectId: string;
//         let resolvedFileId: string;
//         let fileRes: FileItem | null = null;
//         let initialSrc: string | null = null;

//         if (mode === 'view') {
//           if (!viewId) throw new Error('Missing viewId');

//           const view = await getView(viewId);
//           projectId = view.projectId;
//           resolvedFileId = view.fileId;
//           initialSrc = view.previewSrc ?? null;
//         } else {
//           if (!fileId) throw new Error('Missing fileId');

//           fileRes = await getFile(fileId);
//           projectId = fileRes.projectId;
//           resolvedFileId = fileRes._id;
//           initialSrc = fileRes.previewSrc ?? fileRes.fileUrl;
//         }

//         const finalFile = fileRes ?? (await getFile(resolvedFileId));

//         const [viewsRes, todosRes] = await Promise.all([
//           getViews(projectId),
//           getTodos(projectId),
//         ]);

//         setFile(finalFile);
//         setViews(viewsRes);
//         setTodos(todosRes);
//         setCurrentSrc(initialSrc);

//         /* ===== DERIVE PAGES ===== */
//         let derivedPages: PageItem[] = [];

//         if (finalFile.fileType === 'PDF' || finalFile.fileUrl?.toLowerCase().endsWith('.pdf')) {
//           const total = await getPdfTotalPages(finalFile.fileUrl);
//           derivedPages = Array.from({ length: total }).map((_, i) => ({
//             _id: `${finalFile._id}-page-${i + 1}`,
//             index: i + 1,
//             pageNumber: i + 1,
//             fileId: finalFile._id,
//           }));
//         } else if (mode === 'view') {
//           // Giữ logic cũ cho danh sách Views (Image based)
//           derivedPages = viewsRes.map((v, i) => ({
//             _id: v._id,
//             index: i + 1,
//             fileId: v.fileId,
//             imageSrc: v.previewSrc ?? '',
//           }));
//         } else {
//           // Mặc định cho file ảnh đơn
//           derivedPages = [{
//             _id: resolvedFileId,
//             index: 1,
//             imageSrc: initialSrc ?? '',
//             fileId: resolvedFileId
//           }];
//         }
//         setPages(derivedPages);
//         setPageIndex(1);
//       } catch (e) {
//         setError((e as Error).message);
//       } finally {
//         setLoading(false);
//       }
//     }

//     load();
//   }, [mode, fileId, viewId]);

//   useEffect(() => {
//     if (activeTool !=='page') return;
//     if (selectedView?.previewSrc) return;
//     if (!selectedFile) return;

//     async function reLoadPagesForPageTab() {
//       if( 
//         selectedFile?.fileType !=='PDF' && !selectedFile?.fileUrl?.toLocaleLowerCase().endsWith('.pdf')
//       ) {
//         setPages([
//           {
//             _id: selectedFile?._id,
//             index: 1,
//             imageSrc: currentSrc ?? '',
//             fileId: selectedFile?._id
//           },
//         ]);
//         setPageIndex(1);
//         return;
//       }
//       const total = await getPdfTotalPages(selectedFile.fileUrl!);
//       const derivedPages: PageItem[] = Array.from({ length: total }).map(
//         (_, i) => ({
//           _id: `${selectedFile._id}-page-${i + 1}`,
//           index: i + 1,
//           pageNumber: i + 1,
//           fileId: selectedFile._id,
//         })
//       );

//         setPages(derivedPages);
//         setPageIndex((prev) => Math.min(prev, derivedPages.length));
//       }
//     reLoadPagesForPageTab();
//   }, [activeTool, selectedFile]);
//   /* ===== RENDER STATES ===== */
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-full text-gray-500">
//         Loading 2D Management…
//       </div>
//     );
//   }

//   if (error) {
//     return <div className="p-6 text-red-600">{error}</div>;
//   }

//   /* ===== UI ===== */
//   return (
//     <div
//       className="flex h-full w-full overflow-hidden"
//       style={{ height: 'calc(100vh - 120px)' }}
//     >
//       <LeftPanelTool
//         activeKey={activeTool}
//         viewCount={views.length}
//         onClick={(key) => {
//           const tool = key as ActiveTool
//           if (tool === activeTool) {
//             setIsLeftPanelOpen((prev) => !prev);
//           } else {
//             setActiveTool(tool);
//             setIsLeftPanelOpen(true);
//           }
//           setRightPanel(null);
//         }}
//       />

//       {isLeftPanelOpen && (
//         <div className="w-72 border-r border-gray-300 bg-white">
//           <LeftPanelBody
//             activeTool={activeTool}
//             data={{
//               file: selectedFile || file,
//               view: selectedView,
//               pages,
//               pageIndex,
//               views,
//               todos,
//             }}
//             onSelectPage={(src: string, index: number) => {
//               setCurrentSrc(src);
//               setPageIndex(index);
//             }}
          
//             onSelectView={async (v) => {
//               setSelectedView(v);
//               setSelectedTodo(null);

//                 const file = await getFile(v.fileId);
//                   setSelectedFile(file);

//                   setCurrentSrc(v.previewSrc ?? null);
//                   setPages([
//                     {
//                       _id: v._id,
//                       index: 1,
//                       imageSrc: v.previewSrc ?? '',
//                       fileId: v.fileId,
//                     },
//                   ]);

//               setPageIndex(1);
//               setCurrentSrc(v.previewSrc ?? null);
//               setCurrentPage(1)
//               // const file = await getFile(v.fileId);
//               // setSelectedFile(file);

//               setRightPanel({type: 'viewDetail', data: v});

//             }}

//             onSelectTodo={(t) => {
//               setSelectedTodo(t);
//               setSelectedView(null);
//               setSelectedFile(null);

//               if (t.relatedImage) {
//                 setCurrentSrc(t.relatedImage);
//               }

//               setRightPanel({ type: 'todoDetail', data: t });
//             }}

//             onCreateView={() => setRightPanel({ type: 'createView' })}
//             onCreateTodo={() => setRightPanel({ type: 'createTodo' })}
//           />
//         </div>
//       )}

//       <FileViewport
//         file={file}
//         currentSrc={currentSrc}
//         pageIndex={pageIndex}
//         zoom={zoom}
//         rotate={rotate}
//         onZoom={(d: number) =>
//           setZoom((z) => Math.max(0.2, Math.min(3, z + d)))
//         }
//         onRotate={(d: number) => setRotate((r) => (r + d) % 360)}
//         onPrev={() => setPageIndex((p) => Math.max(1, p - 1))}
//         onNext={() =>
//           setPageIndex((p) => Math.min(pages.length, p + 1))
//         }
//       />

//       {rightPanel?.type === 'viewDetail' && (
//         <ViewDetailPanel
//           view={rightPanel.data}
//           onClose={() => setRightPanel(null)}
//         />
//       )}

//       {rightPanel?.type === 'todoDetail' && (
//         <TodoDetailPanel
//           todo={rightPanel.data}
//           onClose={() => setRightPanel(null)}
//         />
//       )}

//       {rightPanel?.type === 'createView' && (
//         <CreateViewPanel
//           onClose={() => setRightPanel(null)}
//           onSave={() => setRightPanel(null)}
//         />
//       )}

//       {rightPanel?.type === 'createTodo' && (
//         <CreateTodoPanel
//           onClose={() => setRightPanel(null)}
//           onSave={() => setRightPanel(null)}
//         />
//       )}
//     </div>
//   );
// }
