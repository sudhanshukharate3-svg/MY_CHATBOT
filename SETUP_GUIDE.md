# MYCHAT APP - Voice Assistant with AI

A complete voice-controlled AI assistant supporting both speech and text input with automatic voice output. Features real-time speech recognition, text-to-speech responses, and support for multiple AI backends (OpenAI, Google Gemini).

## ✨ Features

✅ **Voice Input** - Click the microphone button and speak naturally  
✅ **Text Input** - Type your questions directly  
✅ **Voice Output** - Automatic text-to-speech for all responses  
✅ **Multiple AI Backends** - OpenAI, Google Gemini, or built-in responses  
✅ **Smart Caching** - Reduces API calls and improves response time  
✅ **Error Recovery** - Automatic retry logic for voice recognition  
✅ **Cross-Browser Support** - Works on Chrome, Edge, Safari, Firefox  
✅ **Mobile Friendly** - Responsive design for all screen sizes  

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Keys (Optional)

Create `config.json`:

```json
{
  "openai_api_key": "your-openai-key-here",
  "google_api_key": "your-google-key-here",
  "ai_provider": "google"
}
```

Supported providers:
- `"google"` - Google Gemini (recommended)
- `"openai"` - OpenAI GPT
- `"simple"` - Built-in responses (no API key needed)

### 3. Run the Web Server

```bash
python app_web.py
```

Then open **http://127.0.0.1:5000** in your browser.

### 4. Using the App

**Voice Input:**
1. Click the 🎤 microphone button
2. Allow microphone access when prompted
3. Speak clearly
4. The app converts speech to text automatically
5. Press Enter or click Send to submit

**Text Input:**
1. Type your question directly
2. Press Enter or click Send button

**Voice Output:**
- Responses automatically speak out loud
- Click 🔊 Speak button to replay any response
- Use the microphone button to stop speaking

## 📋 System Requirements

- **Windows/Mac/Linux** with Python 3.7+
- **Microphone** (for voice input)
- **Speakers** (for voice output)
- **Modern Browser** - Chrome, Edge, Safari, or Firefox
- **Internet Connection** (for AI APIs)

## 🛠️ Troubleshooting

### Voice Input Not Working

**Issue:** "No microphone found"
- ✅ Check if microphone is connected
- ✅ Go to Windows Settings → Sound → Input and verify microphone is enabled
- ✅ Restart your browser

**Issue:** "Microphone access denied"
- ✅ Click the lock icon in the address bar
- ✅ Change microphone permission to "Allow"
- ✅ Refresh the page

**Issue:** "No speech heard"
- ✅ Speak louder and clearer
- ✅ Reduce background noise
- ✅ Check your microphone isn't muted
- ✅ Try again after waiting a moment

### Voice Output Not Working

**Issue:** No sound playing
- ✅ Check if speakers are connected and volume is up
- ✅ Open browser settings and check audio is allowed
- ✅ Try clicking the 🔊 Speak button again

**Issue:** Wrong voice
- ✅ The app automatically selects a female voice
- ✅ If not available, uses system default
- ✅ Check Windows → Settings → Time & Language → Speech for available voices

### API Not Working

**Issue:** "API key not configured"
- ✅ Create `config.json` with your API keys
- ✅ Restart the server with `python app_web.py`
- ✅ Make sure you're using valid API keys

**Issue:** "Quota exceeded" (Google API)
- ✅ Enable billing in Google Cloud Console
- ✅ Create a new API key with billing enabled
- ✅ Wait a few minutes before retrying

## 📚 Configuration Guide

### config.json Options

```json
{
  "openai_api_key": "sk-xxx...",           // Your OpenAI API key
  "google_api_key": "AIzaSyxxx...",        // Your Google API key
  "ai_provider": "google",                 // Options: openai, google, simple
  "openai_model": "gpt-3.5-turbo",         // OpenAI model name
  "google_model": "gemini-1.5-flash"       // Google model name
}
```

### Get API Keys

**Google Gemini (Recommended - Free tier available):**
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Get API Key"
3. Copy your API key to `config.json`

**OpenAI:**
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy to `config.json`

## 🚀 Advanced Usage

### Command Line Interface

Run voice assistant in terminal (with microphone):

```bash
python voice_assistant.py
```

This starts the desktop voice interface with microphone input and speaker output.

### Check Cache Statistics

The app caches responses to reduce API calls. View stats:

```python
from cache_helper import response_cache
print(response_cache.stats())
# Output: {'cached_items': 5, 'total_hits': 12, 'total_misses': 3, 'hit_rate': '80.0%'}
```

### Clear Cache

```python
from cache_helper import response_cache
response_cache.clear()
```

## 📊 Performance Tips

1. **Cache enabled by default** - Same questions get instant responses
2. **Voice recognition timeout**: 8 seconds to start speaking, 15 seconds max duration
3. **Auto-retry logic** - Retries failed recognition up to 2 times
4. **Optimized UI** - Real-time feedback with status messages

## 🔧 Environment Variables

```bash
# Change port (default: 5000)
set PORT=8000
python app_web.py

# On Mac/Linux:
export PORT=8000
python app_web.py
```

## 📝 Status Messages

**During Voice Input:**
- 🎤 "Listening… speak now." - Ready for speech
- ✓ "Voice captured → text captured." - Successfully recognized
- ⏱️ "No speech heard." - No voice detected, try again
- ❌ "Microphone access denied." - Need permission

**During Voice Output:**
- 🔊 "Speak" button appears on responses
- Button dims while speaking
- Automatically stops after response completes

## 🐛 Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| Microphone keeps disconnecting | Update your audio drivers |
| Response takes too long | Check internet connection, try simpler query |
| Voice too fast/slow | Use browser's speech settings to adjust |
| Cache not working | Make sure `cache_helper.py` is in same directory |

## 📞 Support

- Check browser console (F12 → Console) for detailed error messages
- Ensure all dependencies installed: `pip install -r requirements.txt`
- Verify microphone access in browser settings
- Test microphone in Windows Sound settings first

## 📄 License

Open source - Feel free to modify and use for your needs.

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Add API keys to `config.json`
3. ✅ Run `python app_web.py`
4. ✅ Open http://127.0.0.1:5000
5. ✅ Click microphone and start chatting!

---

**Enjoy your personal AI assistant! 🤖🎙️**
