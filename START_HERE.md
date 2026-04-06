# 🚀 MYCHAT APP - Quick Start (2 Minutes)

## Step 1: Install Everything
```bash
pip install -r requirements.txt
```

## Step 2: Run Tests (Optional but Recommended)
```bash
python test_mychat.py
```
This checks if everything is properly installed.

## Step 3: Start the Server
```bash
python app_web.py
```

You should see:
```
============================================================
MYCHAT APP - Web Interface
============================================================
✅ Server running at http://127.0.0.1:5000
✅ Open this URL in your browser
...
```

## Step 4: Open in Browser
Click or paste this URL in your browser:
```
http://127.0.0.1:5000
```

## Step 5: Test Voice Input
1. **Click the 🎤 microphone button**
2. **Allow microphone access** when your browser asks
3. **Speak naturally** - "What is the weather?" or "Tell me a joke"
4. **Press Enter** to send or let it auto-send
5. **Listen to the response** - it plays automatically

## Tips for Best Results

✅ **Use Chrome, Edge, or Safari** - best voice support  
✅ **Speak clearly** - natural speech, not too fast  
✅ **Good microphone** - built-in mics work but USB mics are better  
✅ **Quiet environment** - reduces background noise  
✅ **Check microphone** - test in Windows Sound Settings first  

## Troubleshooting

**Voice not working?**
- ✅ Check browser console (F12 → Console) for errors
- ✅ Try typing first - text input should work
- ✅ Refresh page if mic button not responding

**No sound output?**
- ✅ Check volume is not muted
- ✅ Click the 🔊 Speak button on responses
- ✅ Check browser hasn't muted audio

**Wrong answer from AI?**
- ✅ Rephrase your question
- ✅ Be more specific
- ✅ Try a simpler question first

## Add API Keys (Optional)

For better AI responses, create `config.json`:

```json
{
  "ai_provider": "google",
  "google_api_key": "YOUR-API-KEY-HERE"
}
```

Get free Google API key: https://aistudio.google.com/apikey

## Advanced Setup

See **SETUP_GUIDE.md** for:
- 📋 Detailed configuration
- 🔧 Troubleshooting
- 🎯 API setup
- 📊 Performance tips

## Need Help?

1. Check **SETUP_GUIDE.md** for detailed docs
2. Run `python test_mychat.py` to diagnose issues
3. Check browser console (F12) for error messages
4. Verify microphone in Windows Settings first

---

**Enjoy your AI voice assistant! 🎉**

Now open http://127.0.0.1:5000 and start chatting!
