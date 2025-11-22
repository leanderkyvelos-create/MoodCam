

import { supabase } from './supabaseClient';
import { User, Post, ChatThread, Comment, UserSettings, FeedScope, Message } from '../types';
import { LocationService } from './locationService';

// Default Settings
const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  language: 'en',
  privateAccount: true // Default to PRIVATE as requested
};

export const StorageService = {
  
  // --- SYSTEM HEALTH CHECK ---
  checkSystemHealth: async (): Promise<{ healthy: boolean; error?: string }> => {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error && error.code === '42P01') {
      return { healthy: false, error: 'MISSING_TABLES' };
    }
    return { healthy: true };
  },

  // --- AUTHENTICATION ---

  loginUser: async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Login Error:", error);
      if (error.message.includes('Email not confirmed')) {
        throw new Error('EMAIL_NOT_CONFIRMED');
      }
      // Supabase can return "Invalid login credentials" or just "Invalid credentials"
      if (error.message.includes('Invalid login') || error.message.includes('Invalid credentials')) {
        throw new Error('INVALID_LOGIN');
      }
      if (error.message.includes('security purposes')) {
         throw new Error(error.message);
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Login succeeded but no user found.');
    }

    // Fetch profile
    let user = await StorageService.getCurrentUser();

    if (!user) {
        console.log("Profile missing. Attempting fallback creation...");
        const derivedName = email.split('@')[0];
        try {
             return await StorageService.createProfileFallback(data.user.id, derivedName);
        } catch (e: any) {
             console.error("Fallback creation failed:", e);
             if (e.message === 'DATABASE_SETUP_REQUIRED' || e.message.includes('policy')) {
                 throw new Error('PROFILE_CREATION_FAILED');
             }
             throw e;
        }
    }

    return user;
  },

  registerUser: async (email: string, password: string, username: string, isPrivate: boolean, region: string, locationName: string): Promise<User> => {
    const simpleId = Math.floor(100000 + Math.random() * 900000).toString();
    const handle = `${username.toLowerCase().replace(/\s/g, '')}#${simpleId}`;
    const avatarUrl = `https://api.dicebear.com/9.x/micah/svg?seed=${username + simpleId}`;

    const initialSettings: UserSettings = {
        ...DEFAULT_SETTINGS,
        privateAccount: isPrivate
    };

    // 1. Sign Up with Metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: username,
          handle: handle,
          avatar_url: avatarUrl,
          region: region, // Saved to metadata for Trigger
          location: locationName, // Saved to metadata for Trigger
          settings: initialSettings
        }
      }
    });

    if (authError) {
      console.error("Registration Error:", authError);
      if (authError.message.includes('security purposes')) {
          throw new Error(authError.message);
      }
      if (authError.message.includes('already registered')) {
          throw new Error('ALREADY_REGISTERED');
      }
      throw new Error(authError.message);
    }

    if (authData.user && !authData.session) {
        throw new Error('EMAIL_NOT_CONFIRMED');
    }

    if (!authData.user) {
      throw new Error('Registration failed. Please try again.');
    }

    // 2. Wait a moment for Trigger to run, then fetch
    await new Promise(r => setTimeout(r, 1000));
    
    const user = await StorageService.getCurrentUser();
    if (!user) {
        // Fallback
        return await StorageService.createProfileFallback(authData.user.id, username, handle, avatarUrl, isPrivate, region);
    }

    return user;
  },

  createProfileFallback: async (userId: string, username: string, handle?: string, avatarUrl?: string, isPrivate = true, region = 'GLOBAL'): Promise<User> => {
    if (!handle) {
        const simpleId = Math.floor(100000 + Math.random() * 900000).toString();
        handle = `${username.toLowerCase().replace(/\s/g, '')}#${simpleId}`;
    }
    if (!avatarUrl) {
        avatarUrl = `https://api.dicebear.com/9.x/micah/svg?seed=${username}123`;
    }
    
    const settings = { ...DEFAULT_SETTINGS, privateAccount: isPrivate };
    
    const newUserProfile = {
      id: userId,
      name: username,
      handle: handle,
      avatar_url: avatarUrl,
      region: region,
      settings: settings,
      friends: [],
      incoming_requests: [],
      outgoing_requests: []
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(newUserProfile);

    if (profileError) {
      if (profileError.code === '42P01') throw new Error('DATABASE_SETUP_REQUIRED');
      if (profileError.code === '42501') throw new Error('PROFILE_CREATION_FAILED');
      throw new Error("Failed to create profile: " + profileError.message);
    }

    return {
        id: userId,
        name: username,
        handle: handle!,
        avatarUrl: avatarUrl!,
        friends: [],
        incomingRequests: [],
        outgoingRequests: [],
        region: region,
        settings: settings
    };
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error || !profile) return null;

    return {
      id: profile.id,
      name: profile.name,
      handle: profile.handle,
      avatarUrl: profile.avatar_url,
      region: profile.region,
      location: profile.location,
      friends: profile.friends || [],
      incomingRequests: profile.incoming_requests || [],
      outgoingRequests: profile.outgoing_requests || [],
      settings: profile.settings || DEFAULT_SETTINGS,
    };
  },

  updateUser: async (updates: Partial<User>): Promise<User | null> => {
    const currentUser = await StorageService.getCurrentUser();
    if (!currentUser) return null;

    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
    
    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', currentUser.id)
      .select()
      .single();

    if (error) return null;
    return { ...currentUser, ...updates };
  },

  updateUserSettings: async (settings: UserSettings): Promise<User | null> => {
    const currentUser = await StorageService.getCurrentUser();
    if (!currentUser) return null;

    const { error } = await supabase
      .from('profiles')
      .update({ settings: settings })
      .eq('id', currentUser.id);

    if (error) return null;
    return { ...currentUser, settings };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  // --- SOCIAL ---

  searchUsers: async (query: string): Promise<User[]> => {
    const currentUser = await StorageService.getCurrentUser();
    if (!currentUser) return [];

    const lowerQuery = query.toLowerCase().trim();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`name.ilike.%${lowerQuery}%,handle.ilike.%${lowerQuery}%`)
      .limit(20);

    if (error || !data) return [];

    return data
      .filter((u: any) => u.id !== currentUser.id)
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        handle: u.handle,
        avatarUrl: u.avatar_url,
        region: u.region,
        friends: u.friends || [],
        incomingRequests: u.incoming_requests || [],
        outgoingRequests: u.outgoing_requests || [],
        settings: u.settings
      }));
  },

  sendFriendRequest: async (targetId: string): Promise<'SENT' | 'ACCEPTED' | 'ERROR'> => {
    const me = await StorageService.getCurrentUser();
    if (!me) return 'ERROR';

    // Check local state first
    if (me.friends.includes(targetId)) return 'ACCEPTED';

    // Use RPC function to securely add request (bypassing RLS issue on updating other user)
    const { data, error } = await supabase.rpc('send_friend_request', { 
        target_user_id: targetId 
    });

    if (error) {
        console.error("RPC send_friend_request failed:", error);
        return 'ERROR';
    }
    
    return 'SENT';
  },

  acceptFriendRequest: async (requesterId: string): Promise<boolean> => {
    const me = await StorageService.getCurrentUser();
    if (!me) return false;

    // Use RPC function to securely accept request
    const { data, error } = await supabase.rpc('accept_friend_request', { 
        requester_user_id: requesterId
    });

    if (error) {
        console.error("RPC accept_friend_request failed:", error);
        return false;
    }

    return true;
  },

  getRequests: async (me?: User): Promise<{ incoming: User[], outgoing: User[] }> => {
    // If me is not provided, fetch it
    if (!me) {
        me = (await StorageService.getCurrentUser()) || undefined;
    }
    if (!me) return { incoming: [], outgoing: [] };

    let incoming: User[] = [];
    let outgoing: User[] = [];

    if (me.incomingRequests && me.incomingRequests.length > 0) {
        const { data } = await supabase.from('profiles').select('*').in('id', me.incomingRequests);
        if (data) incoming = data.map(mapProfileToUser);
    }

    if (me.outgoingRequests && me.outgoingRequests.length > 0) {
        const { data } = await supabase.from('profiles').select('*').in('id', me.outgoingRequests);
        if (data) outgoing = data.map(mapProfileToUser);
    }

    return { incoming, outgoing };
  },

  // --- MESSAGES ---

  getMessages: async (friendId: string): Promise<Message[]> => {
      const me = await StorageService.getCurrentUser();
      if (!me) return [];

      // Get messages where (sender = me AND receiver = friend) OR (sender = friend AND receiver = me)
      // Also fetch shared post data if available
      const { data, error } = await supabase
        .from('messages')
        .select('*, shared_post:posts(*)')
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${me.id})`)
        .order('created_at', { ascending: true });

      if (error || !data) return [];

      return data.map((row: any) => {
          let sharedPostData: Post | undefined;
          
          if (row.shared_post) {
              // Map the simple post object to full Post type (we might lack userSnapshot inside post table in real DB,
              // but we can reconstruct partially or strict typing)
              // Note: posts table doesn't store user profile snapshot, so we'd need another join ideally.
              // For now, we just return the post structure we have.
              sharedPostData = {
                id: row.shared_post.id,
                userId: row.shared_post.user_id,
                userSnapshot: { name: 'Shared Post', avatarUrl: '', handle: '', friends: [], incomingRequests: [], outgoingRequests: [], id: row.shared_post.user_id }, // Simplified
                imageSrc: row.shared_post.image_src,
                mood: row.shared_post.mood,
                timestamp: new Date(row.shared_post.created_at).getTime(),
                likes: row.shared_post.likes || [],
                comments: [],
                isPublic: row.shared_post.is_public
              };
          }

          return {
            id: row.id,
            senderId: row.sender_id,
            receiverId: row.receiver_id,
            content: row.content,
            createdAt: new Date(row.created_at).getTime(),
            sharedPostId: row.shared_post_id,
            sharedPost: sharedPostData
          };
      });
  },

  sendMessage: async (receiverId: string, content: string, postId?: string): Promise<Message | null> => {
      const me = await StorageService.getCurrentUser();
      if (!me) return null;

      const payload: any = {
        sender_id: me.id,
        receiver_id: receiverId,
        content: content
      };

      if (postId) {
          payload.shared_post_id = postId;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(payload)
        .select('*, shared_post:posts(*)')
        .single();

      if (error || !data) return null;

      // Construct Message
       let sharedPostData: Post | undefined;
       if (data.shared_post) {
           sharedPostData = {
                id: data.shared_post.id,
                userId: data.shared_post.user_id,
                userSnapshot: { name: 'Shared Post', avatarUrl: '', handle: '', friends: [], incomingRequests: [], outgoingRequests: [], id: data.shared_post.user_id },
                imageSrc: data.shared_post.image_src,
                mood: data.shared_post.mood,
                timestamp: new Date(data.shared_post.created_at).getTime(),
                likes: [],
                comments: [],
                isPublic: data.shared_post.is_public
           };
       }

      return {
          id: data.id,
          senderId: data.sender_id,
          receiverId: data.receiver_id,
          content: data.content,
          createdAt: new Date(data.created_at).getTime(),
          sharedPostId: data.shared_post_id,
          sharedPost: sharedPostData
      };
  },

  // --- POSTS ---

  createPost: async (post: Post): Promise<Post> => {
    // Use current user's data for region/location at time of posting
    const me = await StorageService.getCurrentUser();
    
    // Determine Privacy Logic:
    // If post.isPublic is explicit (true/false), use it.
    // If undefined, fall back to the user's account setting (privateAccount).
    // Note: privateAccount = true means isPublic should be false.
    let finalIsPublic = false;
    if (post.isPublic !== undefined) {
        finalIsPublic = post.isPublic;
    } else if (me?.settings?.privateAccount !== undefined) {
        finalIsPublic = !me.settings.privateAccount;
    }

    const { data, error } = await supabase.from('posts').insert({
        user_id: post.userId,
        image_src: post.imageSrc,
        mood: post.mood,
        region: me?.region || post.region || 'GLOBAL', // Tag post with User Region
        location: me?.location || LocationService.getCityFromTimezone(),
        is_public: finalIsPublic,
        likes: [],
        comments: []
    }).select().single();

    if (error || !data) throw error;
    
    return { ...post, id: data.id };
  },

  getFeed: async (scope: FeedScope): Promise<Post[]> => {
    const me = await StorageService.getCurrentUser();
    if (!me) return [];

    let query = supabase.from('posts').select('*, profiles(*)').order('created_at', { ascending: false }).limit(50);
    
    // Strict Server-side filtering for Region
    if (scope === FeedScope.EUROPE) {
        query = query.eq('region', 'EU');
    }

    const { data } = await query;
    if (!data) return [];

    return data.map((row: any) => {
        if (!row.profiles) return null;
        return {
            id: row.id,
            userId: row.user_id,
            userSnapshot: mapProfileToUser(row.profiles),
            imageSrc: row.image_src,
            mood: row.mood,
            timestamp: new Date(row.created_at).getTime(),
            region: row.region, // From Post
            location: row.location,
            isPublic: row.is_public,
            likes: row.likes || [],
            comments: row.comments || []
        };
    }).filter(Boolean)
      .filter((p: any) => {
        const isMe = p.userId === me.id;
        const isFriend = me.friends.includes(p.userId);

        if (scope === FeedScope.FRIENDS) {
            return isMe || isFriend;
        }
        
        // GLOBAL / EUROPE Logic
        if (isMe || isFriend) return true;
        if (p.isPublic) return true;
        if (!p.userSnapshot.settings?.privateAccount) return true;

        // Otherwise hidden
        return false;
    }) as Post[];
  },

  toggleLike: async (postId: string): Promise<void> => {
    const me = await StorageService.getCurrentUser();
    if (!me) return;
    const { data: post } = await supabase.from('posts').select('likes').eq('id', postId).single();
    if (!post) return;

    let likes = post.likes || [];
    likes = likes.includes(me.id) ? likes.filter((id: string) => id !== me.id) : [...likes, me.id];
    await supabase.from('posts').update({ likes }).eq('id', postId);
  },

  addComment: async (postId: string, text: string): Promise<void> => {
    const me = await StorageService.getCurrentUser();
    if (!me) return;
    const { data: post } = await supabase.from('posts').select('comments').eq('id', postId).single();
    if (!post) return;

    const newComment: Comment = {
        id: `c_${Date.now()}`,
        userId: me.id,
        username: me.name,
        avatarUrl: me.avatarUrl,
        text: text,
        timestamp: Date.now()
    };
    await supabase.from('posts').update({ comments: [...(post.comments || []), newComment] }).eq('id', postId);
  },

  getChats: async (): Promise<ChatThread[]> => {
    const me = await StorageService.getCurrentUser();
    if (!me || !me.friends || me.friends.length === 0) return [];

    const { data: friends } = await supabase.from('profiles').select('*').in('id', me.friends);
    
    if (!friends) return [];
    
    return friends.map((f: any) => ({
        id: `c_${f.id}`,
        participantId: f.id,
        user: mapProfileToUser(f),
        lastMessage: 'Tap to chat',
        timestamp: Date.now()
    }));
  }
};

// Helper
const mapProfileToUser = (p: any): User => ({
    id: p.id,
    name: p.name,
    handle: p.handle,
    avatarUrl: p.avatar_url,
    region: p.region,
    location: p.location,
    friends: p.friends || [],
    incomingRequests: p.incoming_requests || [],
    outgoingRequests: p.outgoing_requests || [],
    settings: p.settings
});