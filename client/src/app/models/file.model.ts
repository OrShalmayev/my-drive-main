// src/app/models/file.model.ts
export interface FileStats {
  size: number;
  mtime: Date;
  // Add other stats as needed
}

export interface FileItem {
  name: string;
  path: string;
  relativePath?: string;
  stats: FileStats;
  isFolder: boolean;
  isImage?: boolean;
  isVideo?: boolean;
  imageData?: string;  // The base64 image data
  videoId?: string;
  parentPath?: string;
  files?: FileItem[];
}

export interface DiskDetails {
  free: number;
  size: number;
}

export interface ServerResponse {
  diskDetails: DiskDetails;
  allFilesAndDirs: FileItem[];
}
