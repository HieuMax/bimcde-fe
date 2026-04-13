export interface IAttachment {
  _id?: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface IAssigneeTodo {
  assigneeId: string;
  name: string; // fullName hoặc group name
  label?: string; // email nếu user, name nếu group
  type: "user" | "group";
}

export interface ITagTodo {
  tagId: string;
  name: string;
}

export interface IPriority {
  priorityId: string;
  name: string;
  color: string;
}

export interface IType {
  typeId: string;
  name: string;
}

export interface ITodo {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: IPriority | null;
  completion: number; // 0-100
  assignees?: IAssigneeTodo[] | null;
  type: IType | null;
  tags?: ITagTodo[] | null;
  dueDate?: string; // ISO date string
  projectId: string;
  createdBy: {
    _id: string;
    fullName?: string;
    email?: string;
  };
  items?: {
    fileUrl: string;
    modelId: string;
    expressId: string[];
  }[];
  viewState?: any;
  attachments?: IAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  status?: string;
  priority?: IPriority | null;
  completion?: number;
  assignees?: IAssigneeTodo[] | null;
  type?: IType | null;
  tags?: ITagTodo[] | null;
  dueDate?: string;
  projectId: string;
  items?: {
    fileUrl: string;
    modelId: string;
    expressId: string[];
  }[];
  viewState?: any;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: IPriority | null;
  completion?: number;
  assignees?: IAssigneeTodo[] | null;
  type?: IType | null;
  tags?: ITagTodo[] | null;
  dueDate?: string;
  items?: {
    fileUrl: string;
    modelId: string;
    expressId: string[];
  }[];
}
