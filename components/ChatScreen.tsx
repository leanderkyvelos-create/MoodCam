
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { StorageService } from '../services/storageService';
import { ArrowLeft, Send, MoreVertical, Camera, ArrowRight } from 'lucide-react';

interface ChatScreenProps {
  friend: User;
  currentUser: User;
  onBack: () => void;
  onCameraClick?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ friend, currentUser, onBack, onCameraClick }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 3 seconds (simple real-time simulation)
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    const msgs = await StorageService.getMessages(friend.id);
    setMessages(msgs);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const text = inputText;
    setInputText(''); // Optimistic clear
    setIsSending(true);

    await StorageService.sendMessage(friend.id, text);
    await loadMessages();
    setIsSending(false);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 animate-in slide-in-from-right duration-300">
      {/* Chat Header */}
      <div className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center px-4 justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="text-slate-300" />
          </button>
          <img src={friend.avatarUrl} alt={friend.name} className="w-10 h-10 rounded-full border border-slate-700" />
          <div>
            <h2 className="font-bold text-white text-sm">{friend.name}</h2>
            <p className="text-xs text-fuchsia-500">{friend.handle}</p>
          </div>
        </div>
        <button className="text-slate-500">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                <div className="text-4xl mb-2">👋</div>
                <p>Start the conversation with {friend.name.split(' ')[0]}</p>
            </div>
        ) : (
            messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            
            // RENDER POST CARD IF SHARED
            if (msg.sharedPost) {
                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-2xl overflow-hidden max-w-[220px] border ${isMe ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-900'}`}>
                            <img src={msg.sharedPost.imageSrc} className="w-full h-48 object-cover bg-black" alt="Shared mood" />
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-black" style={{backgroundColor: msg.sharedPost.mood.colorHex}}>
                                        {msg.sharedPost.mood.percentage}%
                                    </span>
                                </div>
                                <h4 className="font-bold text-white text-sm uppercase leading-tight mb-1">{msg.sharedPost.mood.label}</h4>
                                {msg.content && <p className="text-xs text-slate-300 mt-2 italic">"{msg.content}"</p>}
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div 
                        className={`max-w-[75%] px-4 py-2 rounded-2xl relative text-sm ${
                        isMe 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-slate-800 text-slate-200 rounded-bl-none'
                        }`}
                    >
                        {msg.content}
                        <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {formatTime(msg.createdAt)}
                        </span>
                    </div>
                </div>
            );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 flex-shrink-0 pb-6 md:pb-3">
        <button 
            onClick={onCameraClick}
            className="p-3 bg-slate-800 text-fuchsia-400 rounded-full hover:bg-slate-700 transition-colors"
        >
            <Camera size={20} />
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Message..."
          className="flex-1 bg-slate-950 text-white border border-slate-800 rounded-full px-4 py-3 focus:outline-none focus:border-fuchsia-500 transition-colors"
        />
        <button 
          onClick={handleSend}
          disabled={!inputText.trim() || isSending}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
