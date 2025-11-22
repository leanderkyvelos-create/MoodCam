
import React, { useState, useEffect } from 'react';
import { ChatThread, User } from '../types';
import { Search, UserPlus, Check, X, MessageCircle, Clock, ChevronRight, UserMinus, RefreshCw } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface ChatListProps {
  chats: ChatThread[];
  currentUser: User;
  onAddFriend: () => void; // Trigger refresh
  onOpenChat: (friend: User) => void;
}

type ViewMode = 'CHATS' | 'REQUESTS';

export const ChatList: React.FC<ChatListProps> = ({ chats, currentUser, onAddFriend, onOpenChat }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('CHATS');
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  
  const [incomingReqs, setIncomingReqs] = useState<User[]>([]);
  const [outgoingReqs, setOutgoingReqs] = useState<User[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  useEffect(() => {
    refreshRequests();
  }, []);

  // When viewMode switches to REQUESTS, refresh data
  useEffect(() => {
      if (viewMode === 'REQUESTS') {
          refreshRequests();
      }
  }, [viewMode]);

  const refreshRequests = async () => {
    setIsRefreshing(true);
    try {
        // Fetch fresh current user data first to get updated request arrays
        const me = await StorageService.getCurrentUser();
        if (me) {
            const { incoming, outgoing } = await StorageService.getRequests(me);
            setIncomingReqs(incoming);
            setOutgoingReqs(outgoing);
        }
    } finally {
        setIsRefreshing(false);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 1) {
      setIsLoadingSearch(true);
      try {
        const results = await StorageService.searchUsers(query);
        setSearchResults(results);
      } finally {
        setIsLoadingSearch(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSendRequest = async (userId: string) => {
    const status = await StorageService.sendFriendRequest(userId);
    if (status === 'ACCEPTED') {
      onAddFriend(); 
    }
    // Force re-search and refresh requests
    if (searchQuery) {
        const results = await StorageService.searchUsers(searchQuery);
        setSearchResults(results);
    }
    refreshRequests();
  };

  const handleAcceptRequest = async (userId: string) => {
    await StorageService.acceptFriendRequest(userId);
    await refreshRequests();
    onAddFriend();
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 h-full flex flex-col">
      {/* Header Tabs */}
      <div className="pt-16 px-4 pb-2 flex-shrink-0">
          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button 
                onClick={() => setViewMode('CHATS')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'CHATS' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
              >
                  Chats
              </button>
              <button 
                onClick={() => setViewMode('REQUESTS')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all relative ${viewMode === 'REQUESTS' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
              >
                  Requests
                  {incomingReqs.length > 0 && (
                      <span className="absolute top-2 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
              </button>
          </div>
      </div>

      {/* SEARCH OVERLAY (Always available via toggle in header, or inline in CHATS if empty) */}
      {viewMode === 'CHATS' && (
        <div className="px-4 py-2">
             <div className={`relative transition-all duration-300 ${isSearching ? 'mb-4' : ''}`}>
               {!isSearching ? (
                 <button 
                    onClick={() => setIsSearching(true)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-400 flex items-center gap-2 hover:bg-slate-800 transition-colors"
                 >
                    <Search size={18} /> <span className="text-sm">Search friends or Mood IDs...</span>
                 </button>
               ) : (
                 <div className="animate-in fade-in slide-in-from-top-2">
                    <div className="relative flex items-center gap-2">
                        <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input 
                            type="text"
                            placeholder="Search Name or Mood ID..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-10 text-white focus:outline-none focus:border-fuchsia-500"
                            autoFocus
                        />
                        <button 
                            onClick={() => { setIsSearching(false); setSearchQuery(''); setSearchResults([]); }}
                            className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    
                    {/* Search Results */}
                    <div className="mt-4 space-y-2">
                        {isLoadingSearch && <div className="text-center text-slate-500 text-xs">Searching...</div>}
                        {searchResults.map(user => {
                            const isFriend = currentUser.friends.includes(user.id);
                            const isOutgoing = currentUser.outgoingRequests.includes(user.id);
                            const isIncoming = currentUser.incomingRequests.includes(user.id);
                            const isMe = user.id === currentUser.id;

                            if (isMe) return null;

                            return (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full bg-slate-800 object-cover" />
                                        <div>
                                            <div className="font-bold text-white text-sm">{user.name}</div>
                                            <div className="text-xs text-fuchsia-400">{user.handle}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {isFriend ? (
                                            <span className="text-xs text-emerald-500 font-bold px-3 py-1.5">Friends</span>
                                        ) : isOutgoing ? (
                                            <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1.5 rounded-lg">Sent</span>
                                        ) : isIncoming ? (
                                            <button onClick={() => handleAcceptRequest(user.id)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Accept</button>
                                        ) : (
                                            <button 
                                                onClick={() => handleSendRequest(user.id)}
                                                className="bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200"
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 </div>
               )}
             </div>
        </div>
      )}

      {/* VIEW: CHATS */}
      {viewMode === 'CHATS' && !isSearching && (
          <div className="flex-1 px-4 space-y-1">
            {chats.length === 0 ? (
              <div className="text-center py-10 px-6">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <MessageCircle size={32} />
                </div>
                <h3 className="text-white font-bold mb-2">No messages yet</h3>
                <p className="text-slate-400 text-sm mb-4">Your active conversations will appear here.</p>
                <button 
                  onClick={() => setViewMode('REQUESTS')}
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded-full text-sm font-bold hover:bg-slate-800"
                >
                  Check Requests
                </button>
              </div>
            ) : (
              chats.map((chat) => (
                <button 
                  key={chat.id} 
                  onClick={() => onOpenChat(chat.user)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-900/50 active:bg-slate-900 transition-colors text-left group"
                >
                  <div className="relative">
                    <img 
                      src={chat.user.avatarUrl} 
                      alt={chat.user.name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-800 group-hover:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium text-slate-200">{chat.user.name}</h3>
                        <span className="text-[10px] text-slate-600">{new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span className="truncate max-w-[200px]">{chat.lastMessage}</span>
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
      )}

      {/* VIEW: REQUESTS */}
      {viewMode === 'REQUESTS' && (
          <div className="flex-1 px-4 space-y-6 animate-in slide-in-from-right-4">
              
              {/* Refresh Header */}
              <div className="flex justify-end">
                <button 
                  onClick={refreshRequests}
                  className="text-xs flex items-center gap-1 text-slate-400 hover:text-white"
                >
                  <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} /> Refresh List
                </button>
              </div>

              {/* Incoming Requests */}
              <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                      Incoming <span className="bg-slate-800 text-slate-300 px-1.5 rounded text-[10px]">{incomingReqs.length}</span>
                  </h3>
                  {incomingReqs.length === 0 ? (
                      <p className="text-sm text-slate-600 italic">No pending requests.</p>
                  ) : (
                      <div className="space-y-2">
                          {incomingReqs.map(req => (
                              <div key={req.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-fuchsia-500/30">
                                  <div className="flex items-center gap-3">
                                      <img src={req.avatarUrl} className="w-10 h-10 rounded-full" alt={req.name} />
                                      <div>
                                          <div className="font-bold text-white">{req.name}</div>
                                          <div className="text-xs text-slate-400">Wants to follow you</div>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => handleAcceptRequest(req.id)} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500">
                                          <Check size={16} />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Outgoing Requests (Sent) */}
              <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                      Sent <span className="bg-slate-800 text-slate-300 px-1.5 rounded text-[10px]">{outgoingReqs.length}</span>
                  </h3>
                  {outgoingReqs.length === 0 ? (
                      <p className="text-sm text-slate-600 italic">You haven't sent any requests.</p>
                  ) : (
                      <div className="space-y-2">
                          {outgoingReqs.map(req => (
                              <div key={req.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800 opacity-80">
                                  <div className="flex items-center gap-3">
                                      <img src={req.avatarUrl} className="w-10 h-10 rounded-full grayscale" alt={req.name} />
                                      <div>
                                          <div className="font-bold text-slate-300">{req.name}</div>
                                          <div className="text-xs text-slate-500 flex items-center gap-1">
                                              <Clock size={10} /> Pending
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

          </div>
      )}
    </div>
  );
};
