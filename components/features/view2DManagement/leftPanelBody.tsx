'use client';

import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';

import FileDetailTab from './tabView2D/detailTab';
import TodosTab from './tabView2D/todoTab';
import ViewsTab from './tabView2D/viewTab';

import { ViewItem, TodoItem, PageItem, IFile } from '@/types/explorer';

const PagesTab = dynamic(() => import('./tabView2D/pageTab'), { ssr: false });

const CURRENT_USER = { name: 'hao nguyen' };

type ActiveTool = 'filedetail' | 'page' | 'view' | 'todo';

type LeftPanelBodyProps = {
  activeTool: ActiveTool;
  allowedKeys: ActiveTool[];
  data: {
    file: IFile | null;
    view?: ViewItem | null;
    pages: PageItem[];
    pageIndex: number;
    views: ViewItem[];
    todos: TodoItem[];
  };
  onSelectPage: (item: PageItem) => void;
  onSelectView: (view: ViewItem) => void;
  onSelectTodo: (todo: TodoItem) => void;
  onCreateView: () => void;
  onCreateTodo: () => void;
  onDeleteView?: (id: string) => void;
  onDeleteTodo?: (id: string) => void;
  onEditView?: (view: ViewItem) => void;
};

export default function LeftPanelBody(props: LeftPanelBodyProps) {
  const {
    activeTool,
    data,
    onSelectPage,
    onSelectView,
    onSelectTodo,
    onCreateView,
    onCreateTodo,
    onDeleteView,
    onDeleteTodo,
    onEditView
  } = props;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTool}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 12 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="h-full"
      >
        {activeTool === 'filedetail' && (
          <FileDetailTab file={data.file} view={data.view ?? null} />
        )}

        {activeTool === 'page' && (
          <PagesTab
            pages={data.pages}
            currentPageIndex={data.pageIndex}
            onSelectPage={onSelectPage}
            pdfUrl={data.file?.fileUrl}
          />
        )}

        {activeTool === 'view' && (
          <ViewsTab
            views={data.views}
            currentUser={CURRENT_USER.name}
            onSelectView={onSelectView}
            onCreateView={onCreateView}
            onDeleteView={onDeleteView}
            onEditView={onEditView}
          />
        )}

        {activeTool === 'todo' && (
          <TodosTab
            todos={data.todos}
            currentUser={CURRENT_USER.name}
            onSelectTodo={onSelectTodo}
            onCreateTodo={onCreateTodo}
            onDeleteTodo={onDeleteTodo}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
