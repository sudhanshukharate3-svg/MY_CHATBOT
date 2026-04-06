(function () {
  const chatEl = document.getElementById('chat');
  const welcomeEl = document.getElementById('welcome');
  const inputEl = document.getElementById('input');
  const btnSend = document.getElementById('btnSend');
  const btnVoice = document.getElementById('btnVoice');
  const voiceStatus = document.getElementById('voiceStatus');
  const voiceLangEl = document.getElementById('voiceLang');

  let recognition = null;
  let isListening = false;
  let keepListening = false;
  let isSpeaking = false;
  let micStream = null;
  let currentUtterance = null;

  function hideWelcome() {
    welcomeEl.classList.add('hidden');
  }

  function addMessage(role, text, options = {}) {
    hideWelcome();
    const msg = document.createElement('div');
    msg.className = 'msg ' + role;
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = role === 'user' ? 'You' : 'AI';
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    if (options.speak !== false && role === 'assistant' && text) {
      bubble.innerHTML = escapeHtml(text) + ' <button type="button" class="speak-link">🔊 Speak</button>';
    } else {
      bubble.textContent = text;
    }
    msg.appendChild(avatar);
    msg.appendChild(bubble);
    chatEl.appendChild(msg);
    chatEl.scrollTop = chatEl.scrollHeight;
    if (options.speak !== false && role === 'assistant' && text) {
      bubble.querySelector('.speak-link').addEventListener('click', function () { speak(text); });
    }
    return msg;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function addLoading() {
    hideWelcome();
    const msg = document.createElement('div');
    msg.className = 'msg assistant';
    msg.setAttribute('data-loading', '1');
    msg.innerHTML = '<div class="msg-avatar">AI</div><div class="msg-bubble"><div class="msg-loading"><span></span><span></span><span></span></div></div>';
    chatEl.appendChild(msg);
    chatEl.scrollTop = chatEl.scrollHeight;
    return msg;
  }

  function removeLoading() {
    const loading = chatEl.querySelector('[data-loading="1"]');
    if (loading) loading.remove();
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    isSpeaking = true;
    
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = 1.0;
    currentUtterance.pitch = 1.0;
    currentUtterance.volume = 1.0;
    
    // Try to get a female voice for better user experience
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(function (v) { 
      const name = (v.name || '').toLowerCase();
      return name.indexOf('female') !== -1 || 
             name.indexOf('zira') !== -1 || 
             name.indexOf('samantha') !== -1 ||
             name.indexOf('victoria') !== -1 ||
             name.indexOf('moira') !== -1;
    });
    
    if (femaleVoice) {
      currentUtterance.voice = femaleVoice;
    } else if (voices.length > 0) {
      // Use any available voice as fallback
      currentUtterance.voice = voices[0];
    }
    
    currentUtterance.onend = function () {
      isSpeaking = false;
      updateButtonState();
    };
    
    currentUtterance.onerror = function (event) {
      console.error('Speech synthesis error:', event);
      isSpeaking = false;
      updateButtonState();
    };
    
    speechSynthesis.speak(currentUtterance);
  }

  function setVoiceStatus(text, isError) {
    voiceStatus.textContent = text || '';
    voiceStatus.classList.toggle('listening', !isError && text && text.toLowerCase().indexOf('listening') !== -1);
    voiceStatus.classList.toggle('error', !!isError);
  }

  function updateButtonState() {
    btnVoice.disabled = isSpeaking;
    if (isSpeaking) {
      btnVoice.classList.add('speaking');
    } else {
      btnVoice.classList.remove('speaking');
    }
  }

  function sendMessage(text) {
    text = (text || inputEl.value || '').trim();
    if (!text) return;

    inputEl.value = '';
    addMessage('user', text);
    const loading = addLoading();

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
      .then(function (res) { 
        return res.json(); 
      })
      .then(function (data) {
        removeLoading();
        const response = data.response || data.error || 'Sorry, something went wrong.';
        addMessage('assistant', response);
        // Auto-speak the response
        setTimeout(function() { speak(response); }, 500);
      })
      .catch(function (err) {
        removeLoading();
        console.error('Chat error:', err);
        addMessage('assistant', 'Sorry, I could not get a response. Please check your connection and try again.', { speak: false });
      });
  }

  function initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const voiceHint = document.getElementById('voiceHint');
    if (!SpeechRecognition) {
      btnVoice.style.display = 'none';
      if (voiceHint) voiceHint.textContent = 'Voice input needs Chrome or Edge. Type your question above.';
      return;
    }
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = (voiceLangEl && voiceLangEl.value) ? voiceLangEl.value : (navigator.language || 'en-US');

    if (voiceLangEl) {
      voiceLangEl.addEventListener('change', function () {
        if (!recognition) return;
        recognition.lang = voiceLangEl.value || 'en-US';
        setVoiceStatus('Language set to ' + recognition.lang, false);
      });
    }

    recognition.onstart = function () {
      isListening = true;
      btnVoice.classList.add('listening');
      setVoiceStatus('🎤 Listening... speak now. Tap mic again to stop.');
    };

    recognition.onend = function () {
      isListening = false;
      btnVoice.classList.remove('listening');
      if (keepListening) {
        // Browser can auto-stop on silence; restart so capture remains active.
        setTimeout(function () {
          try {
            if (recognition && keepListening && !isListening) recognition.start();
          } catch (_) {}
        }, 200);
      } else {
        setVoiceStatus('Voice input stopped.', false);
      }
    };

    recognition.onresult = function (e) {
      // Build transcript across interim + final results
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += (e.results[i][0] && e.results[i][0].transcript) ? e.results[i][0].transcript : '';
      }
      transcript = (transcript || '').trim();
      if (transcript) {
        inputEl.value = transcript;
      }
      
      const last = e.results[e.results.length - 1];
      if (last && last.isFinal) {
        setVoiceStatus('✓ Voice captured to text. Keep speaking or press Send.');
      }
    };

    recognition.onerror = function (e) {
      var msg = 'Voice input failed. Try again or type.';
      var isError = true;
      
      switch (e.error) {
        case 'not-allowed':
        case 'permission-denied':
          msg = '❌ Microphone access denied. Allow mic in browser settings or use the address bar lock icon.';
          break;
        case 'no-speech':
          msg = '⏱️ No speech heard. Try again and speak clearly.';
          break;
        case 'network':
          msg = '🌐 Network error. Check internet and try again.';
          break;
        case 'audio-capture':
          msg = '🎙️ No microphone found. Plug in a mic or enable it in Windows settings.';
          break;
        case 'service-not-allowed':
          msg = '🔒 Speech service not allowed. Use Chrome/Edge and open on localhost or HTTPS.';
          break;
        case 'bad-grammar':
          msg = '📝 Speech recognition error. Try again.';
          break;
      }
      
      setVoiceStatus(msg, isError);
      isListening = false;
      btnVoice.classList.remove('listening');
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        keepListening = false;
      }
    };
  }

  btnSend.addEventListener('click', function () { sendMessage(); });
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  async function ensureMicPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    if (micStream) return;
    // On most browsers, SpeechRecognition will prompt for mic permission,
    // but explicitly requesting it first is more reliable.
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  btnVoice.addEventListener('click', async function () {
    if (!recognition) return;
    
    // If currently speaking, stop speaking
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      updateButtonState();
      return;
    }
    
    // If currently listening, stop listening
    if (isListening) {
      keepListening = false;
      try { 
        recognition.stop(); 
      } catch (_) {}
      return;
    }
    
    // Start new listening session
    setVoiceStatus('', false);
    try {
      // Show helpful hint for insecure contexts
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        setVoiceStatus('💡 Tip: voice input works best on HTTPS. Localhost is OK.', false);
      }
      
      await ensureMicPermission();
      keepListening = true;
      recognition.lang = (voiceLangEl && voiceLangEl.value) ? voiceLangEl.value : recognition.lang;
      recognition.start();
    } catch (err) {
      console.error('Voice input error:', err);
      setVoiceStatus('❌ Could not start voice input. Check microphone and permissions.', true);
      isListening = false;
      keepListening = false;
      btnVoice.classList.remove('listening');
    }
  });

  if ('speechSynthesis' in window) {
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = function () { 
        speechSynthesis.getVoices();
      };
    }
    // Explicitly load voices
    speechSynthesis.getVoices();
  }

  initSpeech();
})();
