/**
 * 知识库模块类型定义
 */

export interface FileNode {
  key: string;
  title: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  size?: number;
  modifiedAt?: string;
}

export interface Frontmatter {
  title?: string;
  type?: 'concept' | 'entity' | 'source' | 'comparison' | 'synthesis';
  tags?: string[];
  created?: string;
  updated?: string;
  [key: string]: unknown;
}

export interface ParsedMarkdown {
  frontmatter: Frontmatter | null;
  body: string;
}

export interface UploadResult {
  success: boolean;
  path: string;
  message?: string;
}

export interface OrganizeResult {
  success: boolean;
  wikiPath: string;
  title: string;
}

declare global {
  interface Window {
    electronAPI?: {
      kb?: {
        getDirectoryTree: (relativePath?: string) => Promise<FileNode[]>;
        readFile: (path: string) => Promise<string>;
        uploadFile: (params: {
          name: string;
          content: ArrayBuffer | Uint8Array | Buffer | string;
          targetPath?: string;
        }) => Promise<UploadResult>;
        organize: (filePath: string) => Promise<OrganizeResult>;
        deleteFile: (path: string) => Promise<{ success: boolean }>;
      };
    };
  }
}
