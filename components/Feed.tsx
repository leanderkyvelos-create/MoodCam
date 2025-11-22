
import React, { useState } from 'react';
import { Post, User, FeedScope } from '../types';
import { Heart, MessageCircle, MoreHorizontal, Send, ChevronDown, Globe, MapPin, Users, UserPlus, Check, Share2, X } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface FeedProps {
  posts: Post[];
  currentUser: User;
  onRefresh: () => void;
  currentScope: FeedScope;
  onScopeChange: (scope: FeedScope) => void;
}

export const Feed: React.FC<FeedProps> = ({ posts, currentUser, onRefresh, currentScope, onScopeChange }) => {
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showScopeMenu, setShowScopeMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Track loading per post action
  
  // Sharing
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);
  const [shareSearch, setShareSearch] = useState('');

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return '1d+ ago';
  };

  const handleLike = async (postId: string) => {
    await StorageService.toggleLike(postId);
    onRefresh();
  };

  const toggleComments = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      setCommentText('');
    }
  };

  const handlePostComment = async (postId: string) => {
    if (!commentText.trim()) return;
    await StorageService.addComment(postId, commentText);
    setCommentText('');
    onRefresh();
  };

  const handleScopeSelect = (scope: FeedScope) => {
    onScopeChange(scope);
    setShowScopeMenu(false);
  };

  const handleAddFriend = async (userId: string) => {
      setActionLoading(userId);
      await StorageService.sendFriendRequest(userId);
      onRefresh();
      setActionLoading(null);
  };

  const handleSharePost = async (friendId: string) => {
      if (!sharingPostId) return;
      setActionLoading(`share-${friendId}`);
      await StorageService.sendMessage(friendId, "Check out this vibe!", sharingPostId);
      setActionLoading(null);
      setSharingPostId(null); // Close modal
      alert("Sent!");
  };

  // Filter friends for share modal
  const myFriends = React.useMemo(() => {
     // In a real app we'd have full friend objects loaded. 
     // Assuming StorageService.getChats() populated some cache or we fetch on open.
     // For prototype, we'll assume we have to fetch or just rely on ID if we don't have data.
     // Ideally FeedProps should include friends list, but let's just use a quick hack or fetch?
     // Actually, let's just assume we can search friends from the `currentUser.friends` ID list if we had their profiles.
     // Limitation: We only have currentUser friend IDs, not names here.
     // Fix: We will skip detailed names if not available or fetch them. 
     return []; // Placeholder logic, see below
  }, [currentUser]);
  
  // NOTE: Since we need friend details for the share modal, let's fetch them when opening modal
  const [friendList, setFriendList] = useState<User[]>([]);
  
  const openShareModal = async (postId: string) => {
      setSharingPostId(postId);
      setShareSearch('');
      // Fetch friends
      const chats = await StorageService.getChats();
      setFriendList(chats.map(c => c.user));
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide h-full" onClick={() => showScopeMenu && setShowScopeMenu(false)}>
      <div className="pt-16 pb-4 px-4 relative">
        
        {/* Feed Title & Dropdown */}
        <div className="flex items-center justify-between mb-6 relative z-30">
           <div className="relative">
             <button 
               onClick={(e) => { e.stopPropagation(); setShowScopeMenu(!showScopeMenu); }}
               className="flex items-center gap-2 text-2xl font-bold text-white hover:opacity-80 transition"
             >
               {currentScope === FeedScope.FRIENDS && 'Vibe Feed'}
               {currentScope === FeedScope.GLOBAL && 'Global Vibes'}
               {currentScope === FeedScope.EUROPE && 'Europe'}
               <ChevronDown size={20} className={`text-slate-500 transition-transform ${showScopeMenu ? 'rotate-180' : ''}`} />
             </button>

             {showScopeMenu && (
               <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                 <button 
                   onClick={() => handleScopeSelect(FeedScope.FRIENDS)}
                   className={`w-full flex items-center gap-3 p-3 hover:bg-slate-800 text-left ${currentScope === FeedScope.FRIENDS ? 'text-fuchsia-500 bg-slate-800/50' : 'text-slate-300'}`}
                 >
                   <Users size={16} /> Friends
                 </button>
                 <button 
                   onClick={() => handleScopeSelect(FeedScope.EUROPE)}
                   className={`w-full flex items-center gap-3 p-3 hover:bg-slate-800 text-left ${currentScope === FeedScope.EUROPE ? 'text-fuchsia-500 bg-slate-800/50' : 'text-slate-300'}`}
                 >
                   <MapPin size={16} /> Europe
                 </button>
                 <button 
                   onClick={() => handleScopeSelect(FeedScope.GLOBAL)}
                   className={`w-full flex items-center gap-3 p-3 hover:bg-slate-800 text-left ${currentScope === FeedScope.GLOBAL ? 'text-fuchsia-500 bg-slate-800/50' : 'text-slate-300'}`}
                 >
                   <Globe size={16} /> Global
                 </button>
               </div>
             )}
           </div>
        </div>
        
        {posts.length === 0 ? (
          <div className="text-center py-12 px-8">
             <p className="text-slate-500 mb-4">It's quiet... too quiet.</p>
             {currentScope === FeedScope.FRIENDS && (
               <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 inline-block text-sm text-slate-400">
                  Tap the title above to check the <b>Global</b> feed, or go to <b>Chat</b> to find friends.
               </div>
             )}
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const isLiked = post.likes.includes(currentUser.id);
              const isCommenting = expandedPostId === post.id;
              const isMe = post.userId === currentUser.id;
              const isFriend = currentUser.friends.includes(post.userId);
              const isRequested = currentUser.outgoingRequests.includes(post.userId);
              const isLoadingThis = actionLoading === post.userId;

              return (
                <div key={post.id} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800/50 shadow-lg">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={post.userSnapshot.avatarUrl} 
                          alt={post.userSnapshot.name} 
                          className="w-10 h-10 rounded-full border-2 border-slate-800 object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm leading-tight">{post.userSnapshot.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{formatTime(post.timestamp)}</span>
                          {post.region && (
                             <>
                               <span>•</span>
                               <span className="flex items-center gap-0.5">
                                 {post.region === 'EU' && <span className="text-[10px] bg-blue-900/50 text-blue-400 px-1 rounded">EU</span>}
                                 {post.region === 'US' && <span className="text-[10px] bg-red-900/50 text-red-400 px-1 rounded">US</span>}
                                 {post.region === 'ASIA' && <span className="text-[10px] bg-yellow-900/50 text-yellow-400 px-1 rounded">ASIA</span>}
                               </span>
                             </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!isMe && !isFriend && (
                         <div className="ml-auto mr-2">
                            {isRequested ? (
                                <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                                    <Check size={12} /> Sent
                                </span>
                            ) : (
                                <button 
                                    onClick={() => handleAddFriend(post.userId)}
                                    disabled={isLoadingThis}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-fuchsia-400 transition-colors disabled:opacity-50"
                                >
                                    {isLoadingThis ? <div className="w-4 h-4 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" /> : <UserPlus size={16} />}
                                </button>
                            )}
                         </div>
                    )}

                    {isMe && (
                        <button className="text-slate-500 hover:text-white">
                        <MoreHorizontal size={20} />
                        </button>
                    )}
                  </div>

                  {/* Image Content */}
                  <div className="relative aspect-square bg-black group">
                    <img 
                      src={post.imageSrc} 
                      alt="Post" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                      <div className="transform transition-all duration-300">
                        <span 
                          className="inline-block px-3 py-1 rounded-full text-xs font-bold text-black mb-2"
                          style={{ backgroundColor: post.mood.colorHex }}
                        >
                          {post.mood.percentage}% INTENSITY
                        </span>
                        <h4 className="text-xl font-black text-white leading-none mb-1 uppercase">
                          {post.mood.label}
                        </h4>
                        <p className="text-sm text-slate-300 line-clamp-1 italic">
                          "{post.mood.description}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-b border-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                        <button 
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}
                        >
                            <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
                            <span className="text-sm font-medium">{post.likes.length}</span>
                        </button>
                        <button 
                            onClick={() => toggleComments(post.id)}
                            className={`flex items-center gap-2 transition-colors ${isCommenting ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <MessageCircle size={24} />
                            <span className="text-sm font-medium">{post.comments.length}</span>
                        </button>
                        </div>
                        
                        <button 
                            onClick={() => openShareModal(post.id)}
                            className="text-slate-400 hover:text-indigo-400 transition-colors"
                        >
                            <Share2 size={22} />
                        </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {isCommenting && (
                    <div className="bg-slate-950/50 animate-in slide-in-from-top-2">
                      <div className="p-4 max-h-60 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
                        {post.comments.length === 0 ? (
                           <div className="text-center text-slate-500 text-sm py-2">No comments yet. Be the first!</div>
                        ) : (
                           post.comments.map(comment => (
                             <div key={comment.id} className="flex gap-3 text-sm">
                                <img src={comment.avatarUrl} alt={comment.username} className="w-6 h-6 rounded-full flex-shrink-0" />
                                <div>
                                  <span className="font-bold text-slate-200 mr-2">{comment.username}</span>
                                  <span className="text-slate-400">{comment.text}</span>
                                </div>
                             </div>
                           ))
                        )}
                      </div>

                      <div className="p-3 flex items-center gap-2 border-t border-slate-800">
                         <img src={currentUser.avatarUrl} className="w-8 h-8 rounded-full" alt="me" />
                         <input 
                           type="text" 
                           placeholder="Add a comment..."
                           value={commentText}
                           onChange={(e) => setCommentText(e.target.value)}
                           className="flex-1 bg-slate-900 text-white text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 placeholder-slate-600"
                           onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post.id)}
                           autoFocus
                         />
                         <button 
                           onClick={() => handlePostComment(post.id)}
                           disabled={!commentText.trim()}
                           className="p-2 text-fuchsia-500 disabled:text-slate-700 disabled:cursor-not-allowed"
                         >
                           <Send size={20} />
                         </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        <div className="h-8"></div>
      </div>

      {/* SHARE MODAL */}
      {sharingPostId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4 md:p-0 animate-in fade-in duration-200">
              <div className="bg-slate-900 w-full md:max-w-sm rounded-2xl border border-slate-800 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                      <h3 className="font-bold text-white">Send to...</h3>
                      <button onClick={() => setSharingPostId(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                  </div>
                  <div className="p-4">
                      <input 
                        type="text" 
                        placeholder="Search friend..." 
                        value={shareSearch}
                        onChange={(e) => setShareSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white mb-4"
                        autoFocus
                      />
                      <div className="max-h-64 overflow-y-auto space-y-2">
                          {friendList
                             .filter(f => f.name.toLowerCase().includes(shareSearch.toLowerCase()))
                             .map(friend => (
                                 <button 
                                    key={friend.id}
                                    onClick={() => handleSharePost(friend.id)}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-colors"
                                 >
                                     <img src={friend.avatarUrl} className="w-10 h-10 rounded-full" alt={friend.name} />
                                     <div className="text-left flex-1">
                                         <div className="font-bold text-white text-sm">{friend.name}</div>
                                     </div>
                                     {actionLoading === `share-${friend.id}` ? (
                                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                     ) : (
                                         <Send size={16} className="text-fuchsia-500" />
                                     )}
                                 </button>
                             ))}
                          {friendList.length === 0 && (
                              <div className="text-center text-slate-500 text-sm py-4">No friends found.</div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
