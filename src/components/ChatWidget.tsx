import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Bot, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { connectChatSocket } from '../utils/ws-client';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Xin chào! Tôi là trợ lý ảo của HacMieu Journey. Tôi có thể giúp gì cho bạn hôm nay?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect to chat socket when widget opens
  useEffect(() => {
    if (!isOpen) return;
    const ws = connectChatSocket();
    (window as any).__chatSend__ = (payload: any) => ws.send(payload);
    const offIncoming = ws.on('newChat', (payload: any) => {
      const incoming: Message = {
        id: String(Date.now()),
        content: payload?.content || payload?.message || JSON.stringify(payload),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, incoming]);
    });
    const offAny = ws.on('message', (data: any) => {
      if (data?.type === 'newChat') {
        const incoming: Message = {
          id: String(Date.now()),
          content: data?.data?.content || data?.data?.message || JSON.stringify(data?.data ?? data),
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, incoming]);
      }
    });
    return () => { offIncoming(); offAny(); ws.close(); delete (window as any).__chatSend__; };
  }, [isOpen]);

  const quickReplies = [
    'Cách thuê xe?',
    'Giá cả như thế nào?',
    'Chính sách hủy xe?',
    'Liên hệ hỗ trợ'
  ];

  const botResponses: { [key: string]: string } = {
    'cách thuê xe': 'Để thuê xe, bạn có thể:\\n1. Chọn loại xe (ô tô/xe máy)\\n2. Chọn thời gian thuê\\n3. Điền thông tin và thanh toán\\n4. Nhận xe tại địa điểm đã chọn',
    'giá': 'Giá thuê xe phụ thuộc vào loại xe và thời gian:\\n- Xe máy: từ 25.000đ/giờ\\n- Ô tô: từ 120.000đ/giờ\\nBạn có thể xem giá chi tiết khi chọn xe.',
    'hủy': 'Chính sách hủy xe:\\n- Miễn phí hủy trước 24h\\n- Phí hủy 50% nếu hủy trong 24h\\n- Không hoàn tiền nếu hủy trong 2h',
    'liên hệ': 'Bạn có thể liên hệ với chúng tôi qua:\\n📞 Hotline: +84 123 456 789\\n📧 Email: support@hacmieujourney.com\\n🕒 Hỗ trợ 24/7',
    'default': 'Cảm ơn bạn đã liên hệ! Để được hỗ trợ tốt nhất, vui lòng gọi hotline +84 123 456 789 hoặc email support@hacmieujourney.com'
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('thuê') || message.includes('đặt')) {
      return botResponses['cách thuê xe'];
    }
    if (message.includes('giá') || message.includes('tiền') || message.includes('phí')) {
      return botResponses['giá'];
    }
    if (message.includes('hủy') || message.includes('huỷ')) {
      return botResponses['hủy'];
    }
    if (message.includes('liên hệ') || message.includes('hotline') || message.includes('hỗ trợ')) {
      return botResponses['liên hệ'];
    }
    if (message.includes('xin chào') || message.includes('hello') || message.includes('hi')) {
      return 'Xin chào! Rất vui được hỗ trợ bạn. Bạn cần tư vấn về dịch vụ thuê xe nào?';
    }
    
    return botResponses['default'];
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Try sending over WebSocket if available
    try {
      // Fire-and-forget JSON payload; backend can adapt
      const payload = { type: 'sendChat', data: { content: content.trim() } };
      (window as any).__chatSend__?.(payload);
    } catch {}

    // Fallback simulated bot while backend integration is finalized
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(content),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow bg-blue-600 hover:bg-blue-700"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`w-80 shadow-xl transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[500px]'} flex flex-col`}>
        <CardHeader className="flex-shrink-0 pb-3 px-4 py-3 bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm">Trợ lý HacMieu</CardTitle>
                <p className="text-xs text-blue-100">Đang hoạt động</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 text-white hover:bg-blue-500"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 text-white hover:bg-blue-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col flex-1 min-h-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarFallback className={message.sender === 'user' ? 'bg-gray-300' : 'bg-blue-100'}>
                          {message.sender === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3 text-blue-600" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div
                          className={`px-3 py-2 rounded-lg text-sm ${
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.content.split('\\n').map((line, index) => (
                            <div key={index}>{line}</div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 px-1">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-blue-100">
                          <Bot className="h-3 w-3 text-blue-600" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 px-3 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Replies */}
            {messages.length === 1 && (
              <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Câu hỏi gợi ý:</div>
                <div className="flex flex-wrap gap-1">
                  {quickReplies.map((reply, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage(reply)}
                      className="text-xs h-6 px-2"
                    >
                      {reply}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 text-sm"
                  disabled={isTyping}
                />
                <Button
                  onClick={() => handleSendMessage(inputValue)}
                  size="sm"
                  disabled={!inputValue.trim() || isTyping}
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
