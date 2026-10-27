export interface FurnitureProject {
  id: number;
  title: string;
  description?: string;
  category: string;
  r2_file_key: string;
  image_url: string;
  client_name?: string;
  location?: string;
  is_featured?: boolean;
  created_at: string;
}

export interface PresignedUrlResponse {
  presigned_upload_url: string;
  public_image_url: string;
  r2_file_key: string;
}

export interface ProjectCreatePayload {
  title: string;
  description?: string;
  category?: string;
  r2_file_key: string;
  image_url: string;
  client_name?: string;
  location?: string;
  is_featured?: boolean;
}

export const PROJECT_CATEGORIES = [
  'All Projects',
  'Living Room',
  'Bedroom & Wardrobes',
  'Modular Kitchen',
  'Office & Commercial',
  'Custom Woodwork',
  'Dining & Crockery'
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];
