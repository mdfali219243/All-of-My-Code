export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type Post = {
  id: number;
  username: string;
  display_name: string;
  caption: string;
  source_id: number;
  source_username: string;
  source_display_name: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  shared_from_username: string | null;
  is_published?: boolean;
};

export type Comment = {
  id: number;
  username: string;
  display_name: string;
  text: string;
  created_at: string;
};

export type Profile = {
  user: User;
  posts: Post[];
  photo_posts: Post[];
  video_posts: Post[];
  followers_count: number;
  following_count: number;
  is_following: boolean;
  is_own_profile: boolean;
  draft_posts?: Post[];
};

export type Debate = {
  id: number;
  topic: string;
  creator_username: string;
  creator_display_name: string;
  created_at: string;
  is_active: boolean;
  is_host: boolean;
};

export type InboxConversation = {
  username: string;
  display_name: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  connection_label: string;
};

export type InboxContact = {
  username: string;
  display_name: string;
  connection_label: string;
};

export type DirectMessage = {
  id: number;
  text: string;
  created_at: string;
  is_me: boolean;
  sender_id?: number;
  sender_username?: string;
};

export type DebateMessage = {
  id: number;
  text: string;
  created_at: string;
  is_me: boolean;
  sender_id?: number;
  sender_username?: string;
  display_name?: string;
};

export type ShareContact = {
  username: string;
  display_name: string;
};

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

export type AppTab = 'feed' | 'inbox' | 'reels';
