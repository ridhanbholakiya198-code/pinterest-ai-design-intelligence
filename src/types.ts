export interface User {
  id: string;
  name?: string;
  avatar_url?: string;
}

export interface PinterestConnection {
  connected: boolean;
  username?: string;
  last_sync?: string;
}

export interface Pin {
  id: string;
  pinterest_id: string;
  title?: string;
  description?: string;
  link?: string;
  media_url?: string;
  board_id?: string;
  dominant_color?: string;
  status: 'DISCOVERED' | 'IMPORTED' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'IMAGE_UNAVAILABLE' | 'RETRY_WAIT' | 'FAILED';
}
