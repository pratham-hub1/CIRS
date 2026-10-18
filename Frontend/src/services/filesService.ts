import { apiClient } from './apiClient';

export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
}

export const filesService = {
  async uploadFile(file: File): Promise<FileUploadResult> {
    // Validate size client-side (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error(`File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
    }

    if (apiClient.isDemoMode()) {
      // Simulate demo upload
      await new Promise((res) => setTimeout(res, 400));
      return {
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size,
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    return apiClient.upload<FileUploadResult>('/files/upload', formData);
  },
};
