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
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  shared_from_username: string | null;
};

export type Profile = {
  user: User;
  posts: Post[];
  followers_count: number;
  following_count: number;
  is_following: boolean;
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
