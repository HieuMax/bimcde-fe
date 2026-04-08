import type { RecipientOption } from "@/components/features/release/RecipientSelector";

/** Trimble-style levels for file/folder ACL in the explorer. */
export enum ItemAccessLevel {
  FULL = "FULL",
  READ_ONLY = "READ_ONLY",
  NO_ACCESS = "NO_ACCESS",
}

export const ITEM_ACCESS_LABELS: Record<ItemAccessLevel, string> = {
  [ItemAccessLevel.FULL]: "Full access",
  [ItemAccessLevel.READ_ONLY]: "Read only access",
  [ItemAccessLevel.NO_ACCESS]: "No access",
};

export interface ExplicitPermissionGrant {
  recipient: RecipientOption;
  access: ItemAccessLevel;
}

/** Payload when the user saves the permissions dialog. */
export interface ItemPermissionsSavePayload {
  mode: "folder" | "file";
  itemId: string;
  defaultAccess: ItemAccessLevel;
  /** Folder only; when true, inherited entries are read-only in UI. */
  inheritFromParent: boolean;
  explicitGrants: ExplicitPermissionGrant[];
}

/** GET /permissions/item/:projectId/:resourceType/:resourceId */
export interface ItemPermissionsApiResult {
  mode: "folder" | "file";
  itemId: string;
  defaultAccess: ItemAccessLevel;
  inheritFromParent: boolean;
  explicitGrants: ExplicitPermissionGrant[];
}
