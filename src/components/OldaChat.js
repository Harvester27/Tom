import React, { useState, useEffect } from 'react';

const OldaChat = ({ isOpen, onClose, onNewMessage }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Olda',
      text: 'Ahoj! Jak to jde s tréninkem?',
      time: '08:30',
      read: false
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Olda's responses based on player's messages
  const oldaResponses = {
    default: [
      'To zní dobře!',
      'Jasně, chápu.',
      'Tak to je super!',
      'Musíme to někdy probrat osobně.',
      'Na tréninku si o tom popovídáme.'
    ],
    training: [
      'Hlavně nezapomeň na rozcvičku!',
      'Dneska to bude náročný trénink.',
      'Včera jsi hrál výborně!',
      'Nezapomeň si vzít novou hokejku.'
    ],
    match: [
      'Ten zápas včera byl super!',
      'Příště jim to ukážeme!',
      'Musíme potrénovat přesilovky.',
      'V šatně jsem ti nechal nové chrániče.'
    ]
  };

  // Simulate Olda typing and responding
  const simulateOldaResponse = (playerMessage) => {
    setIsTyping(true);
    
    // Determine response category based on message content
    let responseCategory = 'default';
    if (playerMessage.toLowerCase().includes('trénink')) responseCategory = 'training';
    if (playerMessage.toLowerCase().includes('zápas')) responseCategory = 'match';

    // Random response from category
    const responses = oldaResponses[responseCategory];
    const response = responses[Math.floor(Math.random() * responses.length)];

    // Simulate typing delay
    setTimeout(() => {
      setIsTyping(false);
      const newMessage = {
        id: messages.length + 2,
        sender: 'Olda',
        text: response,
        time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      setMessages(prev => [...prev, newMessage]);
      onNewMessage && onNewMessage(newMessage);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      sender: 'Player',
      text: inputText,
      time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      read: true
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    simulateOldaResponse(inputText);
  };

  return (
    <div className={`fixed inset-0 bg-black/90 flex items-center justify-center z-50 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="bg-gradient-to-br from-indigo-900/90 to-indigo-800/90 rounded-xl w-full max-w-md mx-4 overflow-hidden shadow-xl">
        {/* Chat header */}
        <div className="bg-indigo-950/50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-xl">
              👨‍🦳
            </div>
            <div>
              <div className="font-bold text-white">Olda Trenér</div>
              <div className="text-indigo-300 text-sm">
                {isTyping ? 'píše...' : 'online'}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-indigo-800/50 hover:bg-indigo-700/50 flex items-center justify-center text-white"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div 
              key={message.id}
              className={`flex ${message.sender === 'Player' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${
                message.sender === 'Player' 
                  ? 'bg-indigo-600 text-white rounded-t-2xl rounded-l-2xl' 
                  : 'bg-white/10 text-white rounded-t-2xl rounded-r-2xl'
              } p-3 shadow-lg`}>
                <div className="text-sm">{message.text}</div>
                <div className="text-xs mt-1 opacity-70">{message.time}</div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/10 text-white rounded-t-2xl rounded-r-2xl p-3 shadow-lg">
                <div className="flex gap-1">
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce delay-100">•</span>
                  <span className="animate-bounce delay-200">•</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 bg-indigo-950/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Napište zprávu..."
              className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-xl px-4 py-2 focus:outline-none focus:bg-white/20"
            />
            <button
              onClick={handleSendMessage}
              className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OldaChat; 