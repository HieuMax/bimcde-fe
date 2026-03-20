export interface IClashItem {
    name: string;
    distance: string;
    status: "Active" | "Resolved" | "Ignored";
    image?: string;
    item1: {
        modelID: number | string;
        expressID: number | string;
    };
    item2: {
        modelID: number | string;
        expressID: number | string;
    };
    point?: { x: number; y: number; z: number };
}

export interface IClashSet {
    _id: string;
    projectId: string;
    name: string;
    type: "clash" | "clearance";
    status: "Active" | "Resolved" | "Processing";
    tolerance: number;
    ignoreSameType: boolean;
    models: {
        modelId: string | number;
        fileUrl: string;
        version?: string;
        name?: string
    }[];
    clashCount: number;
    items: IClashItem[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateClashSetDto {
    projectId: string;
    name: string;
    type: "clash" | "clearance";
    tolerance: number;
    ignoreSameType: boolean;
    models: { modelId: string | number; fileUrl: string; version?: string }[];
    items: IClashItem[];
}