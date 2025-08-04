import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const ChatComponent = ({ 
  isVisible, 
  onToggle, 
  messages = [], 
  onSendMessage, 
  currentUser 
}) => {
  const [inputText, setInputText] = useState('');
  const [slideAnim] = useState(new Animated.Value(width));
  const [warningMessage, setWarningMessage] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockDuration, setBlockDuration] = useState(0);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  useEffect(() => {
    // Yeni mesaj geldiğinde en alta scroll
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (isBlocked) {
      setWarningMessage('Mesaj gönderme hakkınız geçici olarak kısıtlandı.');
      return;
    }
    
    if (inputText.trim()) {
      console.log('[ChatComponent] Sending message:', inputText.trim());
      console.log('[ChatComponent] onSendMessage function:', typeof onSendMessage);
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  // Uyarı mesajını otomatik olarak temizle
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => {
        setWarningMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  // Blok süresini takip et
  useEffect(() => {
    if (isBlocked && blockDuration > 0) {
      const timer = setTimeout(() => {
        setIsBlocked(false);
        setBlockDuration(0);
      }, blockDuration);
      return () => clearTimeout(timer);
    }
  }, [isBlocked, blockDuration]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Animated.View 
      style={[
        styles.chatContainer,
        {
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <Text style={styles.chatTitle}>Sohbet</Text>
        <TouchableOpacity onPress={onToggle} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Warning Message */}
      {warningMessage ? (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={16} color="#ff6b6b" />
          <Text style={styles.warningText}>{warningMessage}</Text>
          <TouchableOpacity onPress={() => setWarningMessage('')}>
            <Ionicons name="close" size={16} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Block Message */}
      {isBlocked ? (
        <View style={styles.blockContainer}>
          <Ionicons name="ban" size={16} color="#ff4757" />
          <Text style={styles.blockText}>
            Mesaj gönderme hakkınız geçici olarak kısıtlandı.
          </Text>
        </View>
      ) : null}

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz mesaj yok</Text>
            <Text style={styles.emptySubText}>İlk mesajı sen gönder!</Text>
          </View>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.userId === currentUser?.id;
            return (
              <View 
                key={index} 
                style={[
                  styles.messageContainer,
                  isOwnMessage ? styles.ownMessage : styles.otherMessage
                ]}
              >
                <View style={[
                  styles.messageBubble,
                  isOwnMessage ? styles.ownBubble : styles.otherBubble
                ]}>
                  {!isOwnMessage && (
                    <Text style={styles.senderName}>{message.userName}</Text>
                  )}
                  <Text style={[
                    styles.messageText,
                    isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                  ]}>
                    {message.text}
                  </Text>
                  <Text style={[
                    styles.messageTime,
                    isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
                  ]}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor="#999"
            multiline
            maxLength={200}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            onPress={handleSend}
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            disabled={!inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? "white" : "#999"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width * 0.85,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50, // Status bar için
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 0,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 5,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  messageContainer: {
    marginVertical: 3,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 15,
    marginVertical: 2,
  },
  ownBubble: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    borderBottomRightRadius: 5,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  senderName: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: 'white',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 3,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  inputContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingBottom: 20, // Safe area için
    backdropFilter: 'blur(5px)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    color: 'white',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  sendButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: '#ff6b6b',
    borderRadius: 8,
    padding: 10,
    margin: 10,
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '500',
  },
  blockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    borderWidth: 1,
    borderColor: '#ff4757',
    borderRadius: 8,
    padding: 10,
    margin: 10,
    gap: 8,
  },
  blockText: {
    flex: 1,
    color: '#ff4757',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatComponent;