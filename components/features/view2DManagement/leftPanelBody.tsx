'use client';
import dynamic from 'next/dynamic';
import FileDetailTab from './tabView2D/detailTab';
import TodosTab from './tabView2D/todoTab';
import ViewsTab from './tabView2D/viewTab';

import {
  ViewItem,
  TodoItem,
  PageItem,
} from '@/types/view';

import { IFile } from '@/types/explorer'

const PagesTab = dynamic(() => import('./tabView2D/pageTab'), { 
  ssr: false,
  loading: () => <div className="p-4 text-xs text-gray-400">Loading sidebar...</div>
});
const CURRENT_USER = { name: 'hao nguyen' };

type ActiveTool = 'filedetail' | 'page' | 'view' | 'todo';

type LeftPanelData = {
  file: IFile | null;
  location?: string;
  view?: ViewItem | null;
  pages: PageItem[];
  pageIndex: number;
  views: ViewItem[];
  todos: TodoItem[];
};

type LeftPanelBodyProps = {
  activeTool: ActiveTool;
  data: LeftPanelData;

  onSelectPage: (item: PageItem) => void; 
  
  onSelectView: (view: ViewItem) => void;
  onSelectTodo: (todo: TodoItem) => void;

  onCreateView: () => void;
  onCreateTodo: () => void;
};

export default function LeftPanelBody({
  activeTool,
  data,
  onSelectPage,
  onSelectView,
  onSelectTodo,
  onCreateView,
  onCreateTodo, 
}: LeftPanelBodyProps) {

  switch (activeTool) {
    case 'filedetail':
      return <FileDetailTab 
        key= {data.file?._id}
        file={data.file} 
        view={data.view ?? null} />

    case 'page':
      return (
        <PagesTab
          pages={data.pages}
          currentPageIndex={data.pageIndex}
          onSelectPage={onSelectPage}
          pdfUrl={data.file?.fileUrl}
        />
      );

    case 'view':
      return (
        <ViewsTab
          views={data.views}
          currentUser={CURRENT_USER.name}
          onSelectView={onSelectView}
          onCreateView={onCreateView}
        />
      );

    case 'todo':
      return (
        <TodosTab
          todos={data.todos}
          currentUser={CURRENT_USER.name}
          onSelectTodo={onSelectTodo}
          onCreateTodo={onCreateTodo}
        />
      );

    default:
      return null;
  }
}