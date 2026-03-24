import { useState, useEffect, useRef } from 'react';
import { chatbotService } from '../../services/chatbotService';
import { trackOpenChatbot, trackSendChatMessage, trackChatbotRecommendationClick } from '../../services/analyticsService';
import { Link, useNavigate } from 'react-router-dom';
import { unwrapObject } from '../../services/apiClient';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'ai', text: "Hello! I'm your digital curator. Need help finding your next great read? Tell me what you're into!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleOpen = () => {
    if (!isOpen) trackOpenChatbot();
    setIsOpen(!isOpen);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);
    trackSendChatMessage('text');

    try {
      const response = await chatbotService.sendMessage(userMessage);
      const res = unwrapObject(response);
      
      const newMessages = [];
      if (res.reply || res.message || res.response) {
        newMessages.push({ type: 'ai', text: res.reply || res.message || res.response });
      }
      
      const books = res.books || res.recommendations || [];
      if (books && books.length > 0) {
        newMessages.push({ type: 'ai_books', books: books });
      }
      
      if (newMessages.length > 0) {
        setMessages(prev => [...prev, ...newMessages]);
      } else {
        setMessages(prev => [...prev, { type: 'ai', text: "I've noted that. Let me look for something brilliant." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { type: 'ai', text: "Oops, my connection dropped. Try again later!" }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleBookClick = (book, e) => {
     e.preventDefault();
     trackChatbotRecommendationClick(book);
     setIsOpen(false);
     navigate(`/product/${book.product_id}`);
  };

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[110] flex flex-col items-end gap-3">
        {!isOpen && (
          <div className="bg-gradient-to-r from-primary to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-xl relative animate-bounce flex items-center gap-2">
            Ask AI for recommendations!
            <div className="absolute -bottom-1 right-6 w-3 h-3 bg-indigo-600 rotate-45"></div>
          </div>
        )}
        
        <button 
          onClick={handleOpen}
          className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 text-white flex items-center justify-center shadow-[0px_16px_32px_-8px_rgba(0,0,0,0.5)] hover:scale-110 active:scale-90 transition-all"
        >
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <span className="material-symbols-outlined text-3xl">close</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-3xl">auto_awesome</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Open State Panel */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 w-[calc(100%-2rem)] max-w-[420px] h-[650px] max-h-[80vh] bg-surface-container-lowest rounded-[24px] shadow-2xl flex flex-col z-[100] border border-outline-variant/20 transition-all duration-300 pointer-events-auto overflow-hidden">
          {/* Header */}
          <header className="bg-slate-900 p-5 flex flex-shrink-0 items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div>
                <h2 className="font-bold text-white text-base leading-tight">SmartBook AI</h2>
                <p className="text-xs text-slate-400">Personal Curation Engine</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="material-symbols-outlined text-slate-400 hover:text-white transition-colors w-8 h-8 rounded-full flex items-center justify-center text-sm">close</button>
          </header>

          {/* Message List */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar relative bg-gray-50/50">
            {messages.map((msg, idx) => {
              if (msg.type === 'user') {
                return (
                  <div key={idx} className="flex gap-2 w-full justify-end pl-10">
                    <div className="bg-primary text-white p-3.5 rounded-2xl rounded-tr-sm text-[15px] leading-relaxed shadow-sm">
                      {msg.text}
                    </div>
                  </div>
                );
              } else if (msg.type === 'ai') {
                return (
                  <div key={idx} className="flex gap-2 pr-10">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold mt-1">
                      <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                    </div>
                    <div className="bg-white border border-gray-100 p-3.5 rounded-2xl rounded-tl-sm text-[15px] leading-relaxed shadow-sm text-gray-800">
                      {msg.text}
                    </div>
                  </div>
                );
              } else if (msg.type === 'ai_books') {
                return (
                  <div key={idx} className="w-full pb-3 pr-2 pl-3">
                    <div className="flex flex-col gap-2.5">
                      {msg.books.map(book => (
                        <div
                          key={book.product_id}
                          onClick={(e) => handleBookClick(book, e)}
                          className="bg-white rounded-[14px] p-2.5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-gray-100 hover:border-primary/40 cursor-pointer flex gap-3 items-center group transition-colors"
                        >
                          <div className="w-[45px] h-[65px] shrink-0 rounded overflow-hidden bg-gray-100 relative">
                             <img src={book.image_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={book.title} />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="font-bold text-[13px] text-gray-900 leading-[1.2] mb-0.5 line-clamp-2" title={book.title}>{book.title}</h4>
                            <p className="text-[11px] text-gray-500 line-clamp-1 mb-1 truncate">{book.authors}</p>
                            <p className="text-[12px] font-bold text-primary">${Number(book.final_price).toFixed(2)}</p>
                          </div>
                          <div className="shrink-0 flex items-center pr-2">
                            <span className="material-symbols-outlined text-gray-300 group-hover:text-primary group-hover:translate-x-1 text-[20px] transition-all">chevron_right</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            })}
            
            {isLoading && (
               <div className="flex gap-2 pr-10">
                 <div className="w-8 h-8 shrink-0 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold mt-1">
                   <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                 </div>
                 <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
                   <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce delay-75"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce delay-150"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce delay-300"></div>
                 </div>
               </div>
            )}
          </div>

          {/* Input */}
          <footer className="p-4 bg-white border-t border-gray-100 shrink-0">
            <form onSubmit={handleSend} className="relative group">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Message AI Assistant..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-5 pr-12 text-[15px] focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all outline-none"
              />
              <button disabled={isLoading || !input.trim()} type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow hover:bg-primary-dim disabled:opacity-50 disabled:shadow-none transition-colors">
                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              </button>
            </form>
          </footer>
        </div>
      )}
    </>
  );
}
