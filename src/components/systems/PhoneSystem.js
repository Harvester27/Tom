'use client';

import React, { useState, useEffect, useCallback, useReducer } from 'react';
import Image from 'next/image';
import OldaChat from '../OldaChat';

// Pomocná funkce pro načtení dat z localStorage s fallbackem
const loadFromStorage = (key, defaultValue) => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue);
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  
  return defaultValue;
};

// Pomocná funkce pro uložení dat do localStorage
const saveToStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Výchozí konverzace
function getInitialConversationsState() {
  return [
    {
      id: 'olda',
      name: 'Olda Trenér',
      avatar: '/Images/players/oldrich_stepanovsky.png',
      unread: 1, // Start with 1 unread
      lastMessage: 'Ahoj! Zítra máme s partou led v Chomutově od 17:00. Nechceš se přidat? 🏒',
      time: '08:00',
      messages: [
        {
          id: 1,
          sender: 'Olda',
          text: 'Ahoj! Zítra máme s partou led v Chomutově od 17:00. Nechceš se přidat? 🏒',
          time: '08:00',
          read: false
        }
      ]
    },
    {
      id: 'doktor',
      name: 'Doktor Novák',
      avatar: '👨‍⚕️',
      unread: 0,
      lastMessage: 'Výsledky vypadají dobře',
      time: 'včera',
      messages: [
        {
          id: 1,
          sender: 'Doktor',
          text: 'Výsledky vypadají dobře',
          time: 'včera',
          read: true
        }
      ]
    }
  ];
}

// Akce pro reducer
const ACTIONS = {
  SET_PHONE_SCREEN: 'set_phone_screen',
  SET_ACTIVE_CHAT: 'set_active_chat',
  UPDATE_CONVERSATION: 'update_conversation',
  MARK_CONVERSATION_READ: 'mark_conversation_read',
  SET_CONVERSATIONS: 'set_conversations',
  ADD_MESSAGE: 'add_message'
};

// Reducer pro správu stavu telefonu
function phoneReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_PHONE_SCREEN:
      return { ...state, phoneScreen: action.payload };
    
    case ACTIONS.SET_ACTIVE_CHAT:
      return { ...state, activeChat: action.payload };
    
    case ACTIONS.UPDATE_CONVERSATION: {
      const { conversationId, updatedMessages } = action.payload;
      const lastMsg = updatedMessages[updatedMessages.length - 1];
      
      const newConversations = state.conversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: updatedMessages,
            lastMessage: lastMsg ? lastMsg.text : conv.lastMessage,
            time: lastMsg ? lastMsg.time : conv.time,
          };
        }
        return conv;
      });
      
      // Počítáme nepřečtené zprávy
      const totalUnread = calculateUnreadMessages(newConversations);
      
      return { 
        ...state, 
        conversations: newConversations,
        unreadMessages: totalUnread,
        hasNewMessage: totalUnread > 0
      };
    }
    
    case ACTIONS.MARK_CONVERSATION_READ: {
      const conversationId = action.payload;
      
      const newConversations = state.conversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            unread: 0,
            messages: conv.messages.map(msg => ({ ...msg, read: true }))
          };
        }
        return conv;
      });
      
      // Počítáme nepřečtené zprávy
      const totalUnread = calculateUnreadMessages(newConversations);
      
      return { 
        ...state, 
        conversations: newConversations,
        unreadMessages: totalUnread,
        hasNewMessage: totalUnread > 0
      };
    }
    
    case ACTIONS.SET_CONVERSATIONS:
      return { 
        ...state, 
        conversations: action.payload,
        unreadMessages: calculateUnreadMessages(action.payload),
        hasNewMessage: calculateUnreadMessages(action.payload) > 0
      };
    
    case ACTIONS.ADD_MESSAGE: {
      const { conversationId, message } = action.payload;
      
      const newConversations = state.conversations.map(conv => {
        if (conv.id === conversationId) {
          const newMessages = [...conv.messages, message];
          return {
            ...conv,
            messages: newMessages,
            lastMessage: message.text,
            time: message.time,
            unread: conv.unread + (message.sender !== 'Player' ? 1 : 0)
          };
        }
        return conv;
      });
      
      // Počítáme nepřečtené zprávy
      const totalUnread = calculateUnreadMessages(newConversations);
      
      return { 
        ...state, 
        conversations: newConversations,
        unreadMessages: totalUnread,
        hasNewMessage: totalUnread > 0
      };
    }
    
    default:
      return state;
  }
}

// Pomocná funkce pro výpočet nepřečtených zpráv
function calculateUnreadMessages(conversations) {
  return conversations.reduce((sum, conv) => {
    if (conv.unread === 0) return sum;
    
    const unreadFromOthers = conv.messages.filter(msg => 
      msg.sender !== 'Player' && !msg.read
    ).length;
    
    return sum + unreadFromOthers;
  }, 0);
}

/**
 * Hook pro správu telefonu a zpráv
 */
export function usePhone() {
  // Použití reduceru pro komplexní správu stavu
  const [state, dispatch] = useReducer(phoneReducer, {
    phoneScreen: 'home',
    activeChat: null,
    conversations: [],
    unreadMessages: 0,
    hasNewMessage: false
  });
  
  // State pro blikání LED
  const [ledBlink, setLedBlink] = useState(false);
  
  // Načtení konverzací ze storage při inicializaci
  useEffect(() => {
    const savedConversations = loadFromStorage('playerCareerConversations', null);
    
    if (savedConversations) {
      dispatch({
        type: ACTIONS.SET_CONVERSATIONS,
        payload: savedConversations
      });
    } else {
      dispatch({
        type: ACTIONS.SET_CONVERSATIONS,
        payload: getInitialConversationsState()
      });
    }
  }, []);
  
  // Efekt pro ukládání konverzací při změně
  useEffect(() => {
    if (state.conversations && state.conversations.length > 0) {
      saveToStorage('playerCareerConversations', state.conversations);
    }
  }, [state.conversations]);
  
  // Efekt pro LED blikání
  useEffect(() => {
    if (state.hasNewMessage) {
      const blinkInterval = setInterval(() => {
        setLedBlink(prev => !prev);
      }, 1000);
      return () => clearInterval(blinkInterval);
    } else {
      setLedBlink(false);
    }
  }, [state.hasNewMessage]);
  
  // Funkce pro aktualizaci chatu
  const handleChatUpdate = useCallback((conversationId, updatedMessages) => {
    dispatch({
      type: ACTIONS.UPDATE_CONVERSATION,
      payload: { conversationId, updatedMessages }
    });
  }, []);
  
  // Funkce pro označení konverzace jako přečtené
  const markConversationAsRead = useCallback((conversationId) => {
    dispatch({
      type: ACTIONS.MARK_CONVERSATION_READ,
      payload: conversationId
    });
  }, []);
  
  // Funkce pro otevření chatu
  const openChat = useCallback((conv) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_CHAT, payload: conv });
    dispatch({ type: ACTIONS.SET_PHONE_SCREEN, payload: 'chat' });
    dispatch({ type: ACTIONS.MARK_CONVERSATION_READ, payload: conv.id });
  }, []);
  
  // Funkce pro změnu obrazovky telefonu
  const setPhoneScreen = useCallback((screen) => {
    dispatch({ type: ACTIONS.SET_PHONE_SCREEN, payload: screen });
  }, []);
  
  // Funkce pro přidání nové zprávy
  const addMessage = useCallback((conversationId, message) => {
    dispatch({
      type: ACTIONS.ADD_MESSAGE,
      payload: { conversationId, message }
    });
  }, []);
  
  // Funkce pro nastavení všech konverzací
  const setConversations = useCallback((conversations) => {
    dispatch({
      type: ACTIONS.SET_CONVERSATIONS,
      payload: conversations
    });
  }, []);
  
  // Funkce pro nastavení aktivního chatu
  const setActiveChat = useCallback((chat) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_CHAT, payload: chat });
  }, []);
  
  // Funkce pro renderování obsahu telefonu
  const renderPhoneContent = useCallback((props) => {
    const { 
      currentHour, 
      phoneScreen, 
      unreadMessages,
      conversations,
      activeChat,
      setPhoneScreen,
      openChat,
      handleChatUpdate
    } = props;
    
    switch (phoneScreen) {
      case 'messages':
        return (
          <div className="h-full flex flex-col">
            {/* Záhlaví */}
            <div className="p-4 bg-indigo-950/50 flex items-center justify-between">
              <button 
                onClick={() => setPhoneScreen('home')}
                className="w-8 h-8 rounded-lg bg-indigo-800/50 hover:bg-indigo-700/50 flex items-center justify-center text-white"
              >
                ←
              </button>
              <h2 className="text-white font-bold">Zprávy</h2>
              <div className="w-8"></div>
            </div>

            {/* Seznam konverzací */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {conversations.map(conv => (
                <button 
                  key={conv.id}
                  onClick={() => openChat(conv)}
                  className="w-full bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {conv.id === 'olda' ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-500 flex-shrink-0">
                        <Image
                          src="/Images/players/oldrich_stepanovsky.png"
                          alt="Olda"
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          unoptimized={true}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-2xl flex-shrink-0">
                        {conv.avatar}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{conv.name}</span>
                        <span className="text-white/50 text-xs">{conv.time}</span>
                      </div>
                      <p className="text-white/70 text-sm truncate mt-1">
                        {conv.lastMessage.split(' ').slice(0, 3).join(' ') + (conv.lastMessage.split(' ').length > 3 ? '...' : '')}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {conv.unread > 0 && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {conv.unread}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'chat':
        if (!activeChat) return null;
        return (
          <div className="h-full flex flex-col">
            {/* Záhlaví chatu - vždy viditelné */}
            <div className="p-4 bg-indigo-950/50 flex items-center gap-4 sticky top-0 z-10">
              <button 
                onClick={() => setPhoneScreen('messages')}
                className="w-8 h-8 rounded-lg bg-indigo-800/50 hover:bg-indigo-700/50 flex items-center justify-center text-white"
              >
                ←
              </button>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-xl overflow-hidden">
                  {typeof activeChat.avatar === 'string' && (activeChat.avatar.startsWith('/') || activeChat.avatar.startsWith('http')) ? (
                    <Image
                      src={activeChat.avatar}
                      alt={activeChat.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized={true}
                    />
                  ) : (
                    activeChat.avatar
                  )}
                </div>
                <div>
                  <div className="text-white font-bold">{activeChat.name}</div>
                  <div className="text-indigo-300 text-sm">online</div>
                </div>
              </div>
            </div>
            
            {/* Chat component */}
            <div className="flex-1 overflow-hidden">
              <OldaChat
                key={activeChat.id}
                initialMessages={activeChat.messages}
                onChatUpdate={(updatedMessages) => handleChatUpdate(activeChat.id, updatedMessages)}
              />
            </div>
          </div>
        );

      default: // 'home'
        return (
          <>
            <div className="p-4 pt-12">
              {/* Záložky s ikonkami */}
              <div className="flex justify-around mb-6">
                <button 
                  className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors group relative"
                  onClick={() => setPhoneScreen('messages')}
                >
                  <span className="text-xl">💬</span>
                  <span className="text-[10px] text-white/70 group-hover:text-white">Zprávy</span>
                  {unreadMessages > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {unreadMessages}
                    </div>
                  )}
                </button>
                <button className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors group">
                  <span className="text-xl">👥</span>
                  <span className="text-[10px] text-white/70 group-hover:text-white">Kontakty</span>
                </button>
                <button className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors group">
                  <span className="text-xl">📅</span>
                  <span className="text-[10px] text-white/70 group-hover:text-white">Kalendář</span>
                </button>
              </div>

              {/* Seznam posledních zpráv */}
              <div className="space-y-3">
                {conversations.filter(conv => conv.unread > 0).map(conv => (
                  <div 
                    key={conv.id}
                    className={`bg-white/5 p-4 rounded-xl border ${conv.unread > 0 ? 'border-blue-500/50 animate-pulse' : 'border-white/10'} cursor-pointer hover:bg-white/10 transition-colors`}
                    onClick={() => openChat(conv)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-xl overflow-hidden">
                        {typeof conv.avatar === 'string' && 
                         (conv.avatar.startsWith('/') || conv.avatar.startsWith('http')) ? (
                          <Image
                            src={conv.avatar}
                            alt={conv.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized={true}
                          />
                        ) : (
                          conv.avatar
                        )}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium flex items-center gap-2">
                          {conv.name}
                          {conv.unread > 0 && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                        </div>
                        <div className="text-white/50 text-xs">{conv.lastMessage}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
    }
  }, []);

  return {
    phoneScreen: state.phoneScreen,
    activeChat: state.activeChat,
    conversations: state.conversations,
    unreadMessages: state.unreadMessages,
    hasNewMessage: state.hasNewMessage,
    ledBlink,
    setPhoneScreen,
    setActiveChat,
    setConversations,
    handleChatUpdate,
    markConversationAsRead,
    openChat,
    addMessage,
    renderPhoneContent
  };
}

export class PhoneSystem {
  // Tato třída by mohla být použita pro serverovou část nebo více pokročilou implementaci
  // Pro jednoduchost nyní používáme jen hook usePhone
}