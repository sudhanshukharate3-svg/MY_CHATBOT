/**
 * MYCHAT APP - Master Level UI JavaScript
 * Advanced Features: Voice recognition, TTS, Chat history, Settings, Audio visualization
 */

class MasterApp {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.keepListening = false;
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.micStream = null;
    this.visualizer = null;
    this.audioContext = null;
    this.analyser = null;
    
    // State
    this.chatHistory = [];
    this.sessionHistory = [];
    this.settings = {
      autoSpeak: true,
      voiceSpeed: 1,
      voicePitch: 1,
      aiProvider: 'simple',
      showTimestamps: true,
      compactMode: false,
      soundNotifications: false,
      theme: 'dark'
    };
    
    // Load data from localStorage
    this.loadSettings();
    this.loadHistory();
    
    // Initialize
    this.initializeUI();
    this.initializeSpeech();
    this.initializeEventListeners();
    this.initializeTheme();
  }

  /* ==============================================
     Initialization
     ============================================== */

  initializeUI() {
    this.chatEl = document.getElementById('chatMessages');
    this.textInput = document.getElementById('textInput');
    this.voiceBtn = document.getElementById('voiceBtn');
    this.sendBtn = document.getElementById('sendBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.voiceStatus = document.getElementById('voiceStatus');
    this.inputHint = document.getElementById('inputHint');
    this.statusText = document.getElementById('statusText');
    this.themeToggle = document.getElementById('themeToggle');
    this.historyList = document.getElementById('historyList');
    this.historyGrid = document.getElementById('historyGrid');
    
    // Settings elements
    this.voiceSpeedSlider = document.getElementById('voiceSpeed');
    this.voicePitchSlider = document.getElementById('voicePitch');
    this.autoSpeakCheckbox = document.getElementById('autoSpeak');
    this.aiProviderSelect = document.getElementById('aiProvider');
    this.showTimestampsCheckbox = document.getElementById('showTimestamps');
    this.compactModeCheckbox = document.getElementById('compactMode');
    this.soundNotificationsCheckbox = document.getElementById('soundNotifications');
    this.clearCacheBtn = document.getElementById('clearCacheBtn');
    this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    
    // View switchers
    this.navBtns = document.querySelectorAll('.nav-btn');
    this.views = document.querySelectorAll('.view');
    
    // Set initial values
    this.updateSettingsUI();
    this.updateHistoryUI();
  }

  initializeSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const secureForMic = window.isSecureContext || isLocalhost;
    if (!secureForMic) {
      this.voiceBtn.disabled = true;
      this.voiceBtn.title = 'Voice input requires HTTPS or localhost';
      this.inputHint.textContent = 'Voice input blocked on insecure origin. Open http://127.0.0.1:5000 or use HTTPS.';
      this.setStatus('Voice input requires HTTPS or localhost.', true);
      return;
    }
    if (!SpeechRecognition) {
      this.voiceBtn.style.display = 'none';
      this.inputHint.textContent = '💡 Voice input requires Chrome, Edge, or Safari';
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = navigator.language || 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.voiceBtn.classList.add('active');
      this.setStatus('🎤 Listening... speak now (tap mic again to stop)', false);
      this.startVisualizer();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.voiceBtn.classList.remove('active');
      this.stopVisualizer();
      // Browsers may auto-stop on silence; keep mic active until user stops.
      if (this.keepListening) {
        setTimeout(() => {
          try {
            if (this.recognition && !this.isListening && this.keepListening) {
              this.recognition.start();
            }
          } catch (_) {}
        }, 200);
      }
    };

    this.recognition.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += (e.results[i][0]?.transcript || '');
      }
      transcript = transcript.trim();
      if (transcript) this.textInput.value = transcript;

      const isFinal = e.results[e.results.length - 1]?.isFinal;
      if (isFinal) {
        this.setStatus('✓ Speech converted to text. Keep speaking or press Enter to send.', false);
      }
    };

    this.recognition.onerror = (e) => {
      const errors = {
        'not-allowed': '❌ Microphone permission denied',
        'permission-denied': '❌ Microphone permission denied',
        'no-speech': '⏱️ No speech detected. Try again.',
        'network': '🌐 Network error. Check connection.',
        'audio-capture': '🎙️ No microphone found',
        'service-not-allowed': '🔒 Service not allowed'
      };
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        const secureForMic = window.isSecureContext || isLocalhost;
        if (!secureForMic) {
          this.setStatus('Open app on http://127.0.0.1:5000 or HTTPS to use microphone.', true);
        } else {
          this.setStatus('Microphone blocked. Allow microphone in browser site permissions and try again.', true);
        }
      } else {
        this.setStatus(errors[e.error] || 'Voice error. Try again.', true);
      }
      this.isListening = false;
      this.voiceBtn.classList.remove('active');
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        this.keepListening = false;
      }
    };
  }

  initializeEventListeners() {
    // Chat controls - with debouncing to prevent double clicks
    this.isSending = false;
    this.sendBtn.addEventListener('click', () => {
      if (!this.isSending) {
        this.sendMessage();
      }
    });
    this.textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !this.isSending) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
    this.clearBtn.addEventListener('click', () => {
      this.textInput.value = '';
      this.textInput.focus();
      this.clearBtn.classList.add('clicked');
      setTimeout(() => this.clearBtn.classList.remove('clicked'), 200);
    });

    // Navigation
    this.navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const viewName = e.currentTarget.dataset.view;
        this.switchView(viewName);
        // Visual feedback
        e.currentTarget.classList.add('clicked');
        setTimeout(() => e.currentTarget.classList.remove('clicked'), 200);
      });
    });

    // Settings
    this.voiceSpeedSlider.addEventListener('input', (e) => {
      this.settings.voiceSpeed = parseFloat(e.target.value);
      document.getElementById('speedValue').textContent = e.target.value + 'x';
      this.saveSettings();
    });

    this.voicePitchSlider.addEventListener('input', (e) => {
      this.settings.voicePitch = parseFloat(e.target.value);
      document.getElementById('pitchValue').textContent = e.target.value;
      this.saveSettings();
    });

    this.autoSpeakCheckbox.addEventListener('change', (e) => {
      this.settings.autoSpeak = e.target.checked;
      this.saveSettings();
    });

    this.aiProviderSelect.addEventListener('change', (e) => {
      this.settings.aiProvider = e.target.value;
      this.saveSettings();
    });

    this.showTimestampsCheckbox.addEventListener('change', (e) => {
      this.settings.showTimestamps = e.target.checked;
      this.saveSettings();
      this.renderChat();
    });

    this.compactModeCheckbox.addEventListener('change', (e) => {
      this.settings.compactMode = e.target.checked;
      this.saveSettings();
      this.renderChat();
    });

    this.soundNotificationsCheckbox.addEventListener('change', (e) => {
      this.settings.soundNotifications = e.target.checked;
      this.saveSettings();
    });

    this.clearCacheBtn.addEventListener('click', () => {
      this.clearCacheBtn.classList.add('loading');
      this.clearCache();
      setTimeout(() => this.clearCacheBtn.classList.remove('loading'), 1000);
    });
    this.clearHistoryBtn.addEventListener('click', () => {
      this.clearHistoryBtn.classList.add('loading');
      this.clearHistory();
      setTimeout(() => this.clearHistoryBtn.classList.remove('loading'), 1000);
    });

    // Theme toggle
    this.themeToggle.addEventListener('click', () => {
      this.toggleTheme();
      this.themeToggle.classList.add('toggled');
      setTimeout(() => this.themeToggle.classList.remove('toggled'), 400);
    });

    // History item click - handled in attachHistoryDeleteListeners
    this.historyList.addEventListener('click', (e) => {
      const item = e.target.closest('.history-item');
      if (item) {
        this.textInput.value = item.dataset.query;
        this.textInput.focus();
      }
    });
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.settings.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  /* ==============================================
     Chat Functionality
     ============================================== */

  async sendMessage() {
    const message = this.textInput.value.trim();
    if (!message) return;

    // Prevent double submission
    this.isSending = true;
    this.sendBtn.disabled = true;
    this.sendBtn.classList.add('loading');
    this.textInput.disabled = true;

    this.textInput.value = '';
    
    // Add user message to chat immediately
    this.addMessage('user', message);
    
    // Add to history
    this.addToSessionHistory('user', message);

    // Show loading state
    this.showLoadingMessage();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      const assistantMessage = data.response || 'Sorry, I could not generate a response.';

      // Remove loading message
      this.removeLoadingMessage();

      // Add assistant message immediately
      this.addMessage('assistant', assistantMessage);
      this.addToSessionHistory('assistant', assistantMessage);

      // Auto-speak if enabled
      if (this.settings.autoSpeak) {
        setTimeout(() => this.speak(assistantMessage), 300);
      }

      // Save to chat history
      this.chatHistory.push({
        query: message,
        response: assistantMessage,
        timestamp: new Date().toISOString()
      });
      this.saveChatHistory();
      this.updateHistoryUI();

      // Play notification sound
      if (this.settings.soundNotifications) {
        this.playNotificationSound();
      }

    } catch (error) {
      this.removeLoadingMessage();
      this.addMessage('assistant', '❌ Error: Could not connect to the server. Check your connection.');
    } finally {
      // Re-enable buttons
      this.isSending = false;
      this.sendBtn.disabled = false;
      this.sendBtn.classList.remove('loading');
      this.textInput.disabled = false;
      this.textInput.focus();
    }
  }

  addMessage(role, text) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;

    const avatarEl = document.createElement('div');
    avatarEl.className = 'message-avatar';
    avatarEl.textContent = role === 'user' ? 'You' : 'AI';

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'message-bubble';
    bubbleEl.textContent = text;

    const timeEl = document.createElement('div');
    timeEl.className = 'message-time';
    if (this.settings.showTimestamps) {
      timeEl.textContent = new Date().toLocaleTimeString();
    }

    // Add speak button for assistant messages
    if (role === 'assistant') {
      const speakBtn = document.createElement('button');
      speakBtn.className = 'speak-btn';
      speakBtn.innerHTML = '🔊 Speak';
      speakBtn.addEventListener('click', () => this.speak(text));
      bubbleEl.appendChild(speakBtn);
    }

    messageEl.appendChild(avatarEl);
    messageEl.appendChild(bubbleEl);
    if (this.settings.showTimestamps) messageEl.appendChild(timeEl);

    this.chatEl.appendChild(messageEl);
    this.scrollToBottom();
  }

  showLoadingMessage() {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'message assistant';
    loadingEl.id = 'loadingMessage';
    loadingEl.innerHTML = `
      <div class="message-avatar">AI</div>
      <div class="message-bubble">
        <div class="loading">
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
        </div>
      </div>
    `;
    this.chatEl.appendChild(loadingEl);
    this.scrollToBottom();
  }

  removeLoadingMessage() {
    const loadingEl = document.getElementById('loadingMessage');
    if (loadingEl) loadingEl.remove();
  }

  scrollToBottom() {
    this.chatEl.scrollTop = this.chatEl.scrollHeight;
  }

  /* ==============================================
     Voice Features
     ============================================== */

  toggleVoiceInput() {
    if (!this.recognition) return;

    if (this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.voiceBtn.classList.remove('active');
      this.setStatus('', false);
      return;
    }

    if (this.isListening) {
      this.keepListening = false;
      this.recognition.stop();
      this.isListening = false;
      this.voiceBtn.classList.remove('active');
      this.setStatus('Voice input stopped.', false);
      return;
    }

    this.setStatus('Starting voice input...', false);
    this.ensureMicPermission().then(() => {
      this.keepListening = true;
      this.recognition.start();
      this.voiceBtn.classList.add('active');
      this.setStatus('Listening... speak now', false);
    }).catch(err => {
      if (err && err.message === 'INSECURE_CONTEXT') {
        this.setStatus('Voice input needs HTTPS or localhost. Open http://127.0.0.1:5000.', true);
      } else if (err && err.message === 'MEDIA_DEVICES_UNAVAILABLE') {
        this.setStatus('Microphone API unavailable in this browser/device.', true);
      } else {
        this.setStatus('Microphone access denied. Allow mic permission and try again.', true);
      }
      this.voiceBtn.classList.remove('active');
      this.keepListening = false;
    });
  }

  async ensureMicPermission() {
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const secureForMic = window.isSecureContext || isLocalhost;
    if (!secureForMic) {
      throw new Error('INSECURE_CONTEXT');
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('MEDIA_DEVICES_UNAVAILABLE');
    }
    if (this.micStream) return;
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Create audio context for visualization
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaStreamSource(this.micStream);
        source.connect(this.analyser);
      }
    } catch (err) {
      throw err;
    }
  }

  speak(text) {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    this.isSpeaking = true;
    this.voiceBtn.classList.add('active');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.settings.voiceSpeed;
    utterance.pitch = this.settings.voicePitch;
    utterance.volume = 1;

    // Try to get female voice
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => {
      const name = (v.name || '').toLowerCase();
      return name.includes('female') || name.includes('zira') || 
             name.includes('victoria') || name.includes('samantha');
    });

    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onend = () => {
      this.isSpeaking = false;
      this.voiceBtn.classList.remove('active');
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.voiceBtn.classList.remove('active');
    };

    speechSynthesis.speak(utterance);
  }

  setStatus(message, isError = false) {
    this.voiceStatus.textContent = message;
    this.voiceStatus.className = 'status' + (isError ? ' error' : message.includes('✓') ? ' success' : '');
  }

  /* ==============================================
     Audio Visualization
     ============================================== */

  startVisualizer() {
    if (!this.analyser) return;
    
    const canvas = document.getElementById('visualizerCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!this.isListening) return;

      requestAnimationFrame(draw);
      this.analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface');
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;
      let barHeight;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent');
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
      }
    };

    draw();
  }

  stopVisualizer() {
    const canvas = document.getElementById('visualizerCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /* ==============================================
     View Management
     ============================================== */

  switchView(viewName) {
    // Update nav buttons
    this.navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update views
    this.views.forEach(view => {
      view.classList.toggle('active', view.id === viewName + 'View');
    });

    // Update header
    const titles = {
      'chat': { title: 'Chat with AI', subtitle: 'Voice & Text Assistant' },
      'history': { title: 'Chat History', subtitle: 'Your conversation history' },
      'settings': { title: 'Settings', subtitle: 'Customize your experience' }
    };

    document.getElementById('viewTitle').textContent = titles[viewName].title;
    document.getElementById('viewSubtitle').textContent = titles[viewName].subtitle;
  }

  /* ==============================================
     History Management
     ============================================== */

  addToSessionHistory(role, message) {
    this.sessionHistory.push({ role, message, timestamp: new Date() });
  }

  updateHistoryUI() {
    if (this.chatHistory.length === 0) {
      this.historyList.innerHTML = '<p class="empty-state">No chats yet. Start talking!</p>';
      this.historyGrid.innerHTML = '<p class="empty-state">No chat history yet</p>';
      return;
    }

    // Update sidebar history with delete buttons
    const recentChats = this.chatHistory.slice(-10).reverse();
    this.historyList.innerHTML = recentChats
      .map((chat, i) => `
        <div class="history-item-wrapper">
          <button class="history-item" data-query="${this.escapeHtml(chat.query)}" title="${this.escapeHtml(chat.query)}">
            ${this.escapeHtml(chat.query.substring(0, 40))}${chat.query.length > 40 ? '...' : ''}
          </button>
          <button class="history-delete-btn" data-query="${this.escapeHtml(chat.query)}" title="Delete this chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      `).join('');

    // Update history grid
    const allChats = [...this.chatHistory].reverse();
    this.historyGrid.innerHTML = allChats
      .map((chat, idx) => `
        <div class="history-card" data-index="${idx}">
          <div class="history-card-content">
            <div class="history-card-time">${new Date(chat.timestamp).toLocaleString()}</div>
            <div class="history-card-text">${this.escapeHtml(chat.query)}</div>
          </div>
          <button class="history-card-delete" data-index="${idx}" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `).join('');

    // Add event listeners for the new delete buttons
    this.attachHistoryDeleteListeners();
  }

  attachHistoryDeleteListeners() {
    // Delete buttons in sidebar
    document.querySelectorAll('.history-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const query = btn.dataset.query;
        this.deleteHistoryItem(query);
      });
    });

    // Delete buttons in grid
    document.querySelectorAll('.history-card-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        const reverseIndex = this.chatHistory.length - 1 - index;
        this.deleteHistoryItemByIndex(reverseIndex);
      });
    });

    // Click history card to load query
    document.querySelectorAll('.history-card').forEach(card => {
      const deleteBtn = card.querySelector('.history-card-delete');
      card.addEventListener('click', (e) => {
        if (e.target === deleteBtn || deleteBtn.contains(e.target)) return;
        const query = card.querySelector('.history-card-text').textContent;
        this.textInput.value = query;
        this.textInput.focus();
      });
    });
  }

  deleteHistoryItem(query) {
    if (confirm(`Delete "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"?`)) {
      this.chatHistory = this.chatHistory.filter(chat => chat.query !== query);
      this.saveChatHistory();
      this.updateHistoryUI();
    }
  }

  deleteHistoryItemByIndex(index) {
    if (index >= 0 && index < this.chatHistory.length) {
      const query = this.chatHistory[index].query;
      if (confirm(`Delete "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"?`)) {
        this.chatHistory.splice(index, 1);
        this.saveChatHistory();
        this.updateHistoryUI();
      }
    }
  }

  clearHistory() {
    if (confirm('Clear all chat history?')) {
      this.chatHistory = [];
      this.saveChatHistory();
      this.updateHistoryUI();
    }
  }

  /* ==============================================
     Settings Management
     ============================================== */

  updateSettingsUI() {
    this.voiceSpeedSlider.value = this.settings.voiceSpeed;
    document.getElementById('speedValue').textContent = this.settings.voiceSpeed + 'x';
    
    this.voicePitchSlider.value = this.settings.voicePitch;
    document.getElementById('pitchValue').textContent = this.settings.voicePitch;
    
    this.autoSpeakCheckbox.checked = this.settings.autoSpeak;
    this.aiProviderSelect.value = this.settings.aiProvider;
    this.showTimestampsCheckbox.checked = this.settings.showTimestamps;
    this.compactModeCheckbox.checked = this.settings.compactMode;
    this.soundNotificationsCheckbox.checked = this.settings.soundNotifications;
  }

  clearCache() {
    if (confirm('Clear API response cache?')) {
      fetch('/api/cache', { method: 'DELETE' }).then(() => {
        alert('Cache cleared!');
      }).catch(() => {
        alert('Could not clear cache');
      });
    }
  }

  toggleTheme() {
    const newTheme = this.settings.theme === 'dark' ? 'light' : 'dark';
    this.settings.theme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }

  /* ==============================================
     Utility Functions
     ============================================== */

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  playNotificationSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  renderChat() {
    this.chatEl.innerHTML = '';
    this.sessionHistory.forEach(msg => {
      this.addMessage(msg.role, msg.message);
    });
  }

  /* ==============================================
     Storage Functions
     ============================================== */

  saveSettings() {
    localStorage.setItem('appSettings', JSON.stringify(this.settings));
  }

  loadSettings() {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
  }

  saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
  }

  loadHistory() {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      try {
        this.chatHistory = JSON.parse(saved);
      } catch (e) {
        this.chatHistory = [];
      }
    }
  }
}

// Initialize when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new MasterApp();

  // Initialize speech voices
  if ('speechSynthesis' in window) {
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }
    speechSynthesis.getVoices();
  }
});
