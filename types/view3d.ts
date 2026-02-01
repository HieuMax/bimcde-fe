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
        modelTransforms?: IModelTransform[];
        clippingPlanes?: { normal: number[], constant: number }[];
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
export interface IModelTransform {
    modelID: number;
    fileUrl: string;
    position: { x: number, y: number, z: number };
    rotation: { x: number, y: number, z: number };
    scale: number;
}