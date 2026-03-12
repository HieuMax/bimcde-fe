export interface ViewOptions {
  annotations: boolean
  clipPlanes: boolean
  grids: boolean
  ifcTypes: boolean
  objectAttachments: boolean
}
export interface IView {
    _id: string;
    title: string;
    description?: string;
    projectId: string;
    createdBy: {
        _id: string;
        fullName: string;
        email: string;
    };
    shareWith?: string[];
    tags?: string[];

    // Context Model
    items?: {
        fileUrl: string;
        modelId: string;
        expressId: string[];
    }[];

    // 3D State
    viewState?: {
        camera: {
            position: { x: number, y: number, z: number };
            target: { x: number, y: number, z: number };
        };
        
        visibility: any[];
        selection: any[];
        thumbnail?: string; // Base64
        modelOpacity?: number;

        clipping?: {
            enabled: boolean;
            mode: 'plane' | 'vertical' | 'box' | 'none'; 
            planes: {
                normal: { x: number, y: number, z: number };
                constant: number;
            }[];
        };

        measurements?: {
            start: { x: number, y: number, z: number };
            end: { x: number, y: number, z: number };
            value: number; 
        }[];
        viewOptions?: ViewOptions
    };

    
    createdAt: string;
    updatedAt: string;
}

export interface CreateViewDto {
    title: string;
    description?: string;
    projectId: string;
    shareWith?: string[];
    tags?: string[];
    items?: any[];
    viewState?: any;
}

export interface UpdateViewInfoDto {
    title?: string;
    description?: string;
    shareWith?: string[];
    tags?: string[];
}