
export enum AppState {
  LOGIN = 'LOGIN',
  MAIN_APP = 'MAIN_APP',
  CAMERA = 'CAMERA',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export enum Tab {
  FEED = 'FEED',
  CHAT = 'CHAT',
  SETTINGS = 'SETTINGS'
}

export enum FeedScope {
  FRIENDS = 'FRIENDS',
  EUROPE = 'EUROPE',
  GLOBAL = 'GLOBAL'
}

export interface MoodResult {
  percentage: number;
  label: string;
  description: string;
  colorHex: string;
}

export interface GeneratedMoodResponse {
  mood_percentage: number;
  mood_label: string;
  witty_comment: string;
  accent_color: string;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  language: 'en' | 'de';
  privateAccount: boolean;
}

export interface User {
  id: string;
  name: string;
  handle: string; // The "Phone Number" ID (e.g., @user#123456)
  avatarUrl: string;
  region?: string; // 'EU', 'US', 'ASIA', etc.
  location?: string; // e.g. "Berlin"
  friends: string[]; // Array of User IDs
  incomingRequests: string[]; // Array of User IDs who want to follow me
  outgoingRequests: string[]; // Array of User IDs I want to follow
  isOnline?: boolean;
  settings?: UserSettings;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  timestamp: number;
}

export interface Post {
  id: string;
  userId: string; // Reference to User ID
  userSnapshot: User; // Snapshot of user data at time of post (for display speed)
  imageSrc: string;
  mood: MoodResult;
  timestamp: number; // Unix timestamp
  region?: string; // 'EU', 'US', 'ASIA', 'GLOBAL'
  location?: string; // Specific city/country
  likes: string[]; // Array of User IDs who liked
  comments: Comment[]; // Array of actual comments
  isPublic?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: number;
  sharedPostId?: string;
  sharedPost?: Post;
}

export interface ChatThread {
  id: string;
  participantId: string; // The friend's ID
  user: User;
  lastMessage?: string;
  timestamp: number;
}
