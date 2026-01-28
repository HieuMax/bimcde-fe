export interface ActivityTypeOption {
  value: string;
  label: string;
}

export interface ActivityGroupOption {
  group: string;
  label: string;
  children: ActivityTypeOption[];
}

export const ACTIVITY_TYPES_TREE: ActivityGroupOption[] = [
  {
    group: "FILE",
    label: "Files",
    children: [
      { value: "UPLOAD", label: "Files uploaded" },
      { value: "DELETE", label: "Files deleted" },
      { value: "MOVE", label: "Files moved" },
      { value: "RENAME", label: "Files renamed" },
      { value: "LOCK", label: "File locked" },
      { value: "UNLOCK", label: "File unlocked" },
    ],
  },
  {
    group: "FOLDER",
    label: "Folders",
    children: [
      { value: "CREATE", label: "Folders created" },
      { value: "RENAME", label: "Folders renamed" },
      { value: "DELETE", label: "Folders deleted" },
      { value: "MOVE", label: "Folders moved" },
    ],
  },
  {
    group: "MEMBER",
    label: "Users",
    children: [
      { value: "INVITE", label: "User invited" },
      { value: "REMOVE", label: "User removed" },
      { value: "ROLE_UPDATE", label: "Role updated" },
    ],
  },
  {
    group: "VIEW",
    label: "Views",
    children: [
      { value: "CREATE", label: "View created" },
      { value: "UPDATE", label: "View updated" },
      { value: "DELETE", label: "View deleted" },
    ],
  },
  {
    group: "RELEASE",
    label: "Releases",
    children: [
      { value: "CREATE", label: "Release created" },
      { value: "UPDATE", label: "Release updated" },
      { value: "SEND", label: "Release sent" },
    ],
  },
  {
    group: "COMMENT",
    label: "Comments",
    children: [
      { value: "CREATE", label: "Comment added" },
      // { value: "DELETE", label: "Comment deleted" }, // Tùy business
    ],
  },
];
