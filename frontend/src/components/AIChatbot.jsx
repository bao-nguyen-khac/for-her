import React, { useState, useEffect, useRef, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 phút (300.000 ms)

const DEFAULT_MESSAGES = [
  {
    role: 'assistant',
    content: 'Chào bạn! Mình là **Stylist Áo Dài ForHer** 🌸. Mình có thể hỗ trợ bạn chọn chất liệu (lụa gấm, tơ óng, chéo Hàn), phối màu quần mặc kèm hoặc gợi ý mẫu áo dài phù hợp nhất cho các dịp Tết, cưới hỏi, lễ tiệc... \n\nBạn cần mình tư vấn như thế nào hôm nay?',
    recommendedProducts: []
  }
];

const AIChatbot = () => {
  const { backendUrl, formatPrice, getFinalPrice, getDiscountLabel } = useContext(ShopContext);
  const [isOpen, setIsOpen] = useState(false);
  const [lastActivity, setLastActivity] = useState(() => {
    const savedTime = localStorage.getItem('forher_ai_chat_timestamp') || sessionStorage.getItem('forher_ai_chat_timestamp');
    return savedTime ? Number(savedTime) : Date.now();
  });

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('forher_ai_chat') || sessionStorage.getItem('forher_ai_chat');
    const savedTime = localStorage.getItem('forher_ai_chat_timestamp') || sessionStorage.getItem('forher_ai_chat_timestamp');

    if (saved && savedTime) {
      const elapsed = Date.now() - Number(savedTime);
      if (elapsed < INACTIVITY_LIMIT) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    // Xóa lịch sử hết hạn
    localStorage.removeItem('forher_ai_chat');
    localStorage.removeItem('forher_ai_chat_timestamp');
    sessionStorage.removeItem('forher_ai_chat');
    sessionStorage.removeItem('forher_ai_chat_timestamp');
    return DEFAULT_MESSAGES;
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Cập nhật lưu trữ và timestamp hoạt động
  const updateChatStorage = (newMessages) => {
    const now = Date.now();
    setLastActivity(now);
    localStorage.setItem('forher_ai_chat', JSON.stringify(newMessages));
    localStorage.setItem('forher_ai_chat_timestamp', String(now));
  };

  // Kiểm tra tự động xóa lịch sử sau 5 phút không có hoạt động
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      if (elapsed >= INACTIVITY_LIMIT) {
        localStorage.removeItem('forher_ai_chat');
        localStorage.removeItem('forher_ai_chat_timestamp');
        sessionStorage.removeItem('forher_ai_chat');
        sessionStorage.removeItem('forher_ai_chat_timestamp');
        setMessages(DEFAULT_MESSAGES);
      }
    }, 10000); // Kiểm tra mỗi 10 giây

    return () => clearInterval(interval);
  }, [lastActivity]);

  // Lưu lịch sử chat mỗi khi tin nhắn thay đổi (trừ tin mặc định)
  useEffect(() => {
    if (messages.length > 1) {
      updateChatStorage(messages);
    }
  }, [messages]);

  // Danh sách các câu hỏi nhanh gợi ý
  const quickPrompts = [
    'Tư vấn áo dài mặc đi tiệc cưới',
    'Dáng người tròn trịa nên chọn cổ gì?',
    'Phối quần màu gì hợp với áo dài đỏ gấm?',
    'Mặc Tết chọn áo dài cách tân chất liệu gì?'
  ];

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (text) => {
    const textToSend = text || inputValue.trim();
    if (!textToSend) return;

    if (!text) {
      setInputValue('');
    }

    const newUserMessage = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    updateChatStorage(updatedMessages);
    setIsLoading(true);

    try {
      const chatHistory = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await axios.post(`${backendUrl}/api/ai/chat`, {
        messages: chatHistory
      });

      if (response.data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: response.data.reply,
          recommendedProducts: response.data.recommendedProducts || []
        };
        setMessages((prev) => {
          const newMsgs = [...prev, assistantMessage];
          updateChatStorage(newMsgs);
          return newMsgs;
        });
      } else {
        const errorMessage = {
          role: 'assistant',
          content: `Rất tiếc, đã xảy ra lỗi: ${response.data.message || 'Không thể kết nối dịch vụ.'}`,
          recommendedProducts: []
        };
        setMessages((prev) => {
          const newMsgs = [...prev, errorMessage];
          updateChatStorage(newMsgs);
          return newMsgs;
        });
      }
    } catch (error) {
      console.error(error);
      const errorMessage = {
        role: 'assistant',
        content: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau ít phút.',
        recommendedProducts: []
      };
      setMessages((prev) => {
        const newMsgs = [...prev, errorMessage];
        updateChatStorage(newMsgs);
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Hàm parse markdown cơ bản (bôi đậm **, xuống dòng \n, gạch đầu dòng *)
  const parseMarkdown = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const bulletMatch = line.match(/^[\*\-]\s+(.*)/);
      
      const processBold = (str) => {
        const parts = str.split('**');
        return parts.map((part, i) => {
          if (i % 2 === 1) {
            return <strong key={i} className="font-semibold text-neutral-900">{part}</strong>;
          }
          return part;
        });
      };

      if (bulletMatch) {
        return (
          <li key={idx} className="list-disc ml-4 my-1 text-sm text-neutral-700">
            {processBold(bulletMatch[1])}
          </li>
        );
      }
      
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="my-1 text-sm text-neutral-700 leading-relaxed">
          {processBold(line)}
        </p>
      );
    });
  };

  return (
    <div className="font-sans">
      {/* 1. Nút bong bóng nổi (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full text-white shadow-2xl transition-all duration-300 cursor-pointer ${
          isOpen 
            ? 'bg-neutral-800 rotate-90 scale-95' 
            : 'bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 hover:scale-105 active:scale-95'
        }`}
        style={{
          boxShadow: isOpen 
            ? '0 10px 25px -5px rgba(0,0,0,0.2)' 
            : '0 10px 30px -5px rgba(0,0,0,0.3), 0 0 15px 2px rgba(180,180,180,0.3)'
        }}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 animate-pulse">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.813zM18 10.5l-.375 2.625L15 13.5l2.625.375L18 16.5l.375-2.625L21 13.5l-2.625-.375L18 10.5z" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>
        )}
      </button>

      {/* 2. Khung Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 w-[360px] sm:w-[400px] h-[550px] max-h-[80vh] z-50 flex flex-col bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xl transition-all duration-300 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-4 flex items-center justify-between border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 text-rose-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.813z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-sm tracking-wide text-neutral-100">Stylist Áo Dài AI 🌸</h3>
              <p className="text-xs text-rose-300 flex items-center gap-1.5 font-light">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                Tư vấn trực tuyến 24/7
              </p>
            </div>
          </div>
          {/* Nút thu nhỏ */}
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Nội dung hội thoại */}
        <div className="flex-1 overflow-y-auto p-4 bg-neutral-50/50 flex flex-col gap-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Bong bóng tin nhắn */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    isUser
                      ? 'bg-neutral-800 text-white rounded-tr-none'
                      : 'bg-white border border-neutral-100 text-neutral-800 rounded-tl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : (
                    <div>{parseMarkdown(msg.content)}</div>
                  )}
                </div>

                {/* Danh sách sản phẩm gợi ý đi kèm */}
                {!isUser && msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="mt-3 w-full max-w-[90%]">
                    <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                      Sản phẩm gợi ý cho bạn:
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                      {msg.recommendedProducts.map((prod) => {
                        const finalPrice = getFinalPrice(prod);
                        const discountLabel = getDiscountLabel(prod);
                        return (
                          <div
                            key={prod._id}
                            onClick={() => setIsOpen(false)}
                            className="bg-white border border-neutral-100 rounded-xl p-2 min-w-[130px] max-w-[130px] flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow snap-start"
                          >
                            <Link to={`/product/${prod._id}`}>
                              <div className="relative aspect-[3/4] rounded-lg bg-neutral-100 overflow-hidden mb-2">
                                <img
                                  src={prod.image?.[0]}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                                {discountLabel && (
                                  <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] px-1 rounded">
                                    {discountLabel}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-medium text-neutral-800 truncate mb-1">
                                {prod.name}
                              </h4>
                              <p className="text-xs font-semibold text-neutral-900">
                                {formatPrice(finalPrice)}
                              </p>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Hiệu ứng gõ chữ khi đang tải */}
          {isLoading && (
            <div className="flex items-center gap-1.5 bg-white border border-neutral-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm w-16">
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Các gợi ý câu hỏi nhanh */}
        {!isLoading && messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-neutral-100 bg-white">
            <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="bg-neutral-100 text-neutral-600 hover:bg-neutral-800 hover:text-white transition-colors px-3 py-1 rounded-full text-xs whitespace-nowrap cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Khung nhập tin nhắn */}
        <div className="p-3 border-t border-neutral-100 bg-white flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Hỏi trợ lý áo dài AI..."
            className="flex-1 bg-neutral-100 text-sm px-4 py-2.5 rounded-full outline-none focus:bg-neutral-50 focus:border focus:border-neutral-300 transition-all text-neutral-800 placeholder-neutral-400"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="w-10 h-10 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 transform rotate-45">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
