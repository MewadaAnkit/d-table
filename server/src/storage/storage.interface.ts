export interface SavedFile {
  storageKey: string;
  sizeBytes: number;
  mimeType: string;
}

export interface IStorageService {
  saveImage(base64Data: string, prefix?: string): Promise<SavedFile>;
  getFileStream(storageKey: string): NodeJS.ReadableStream | null;
  getFilePath(storageKey: string): string | null;
  deleteFile(storageKey: string): Promise<boolean>;
}
