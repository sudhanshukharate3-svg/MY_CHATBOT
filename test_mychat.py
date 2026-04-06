#!/usr/bin/env python3
"""
Test script for MYCHAT APP - Verifies all components are working
Run: python test_mychat.py
"""

import sys
import os
import subprocess

def print_header(text):
    """Print formatted header."""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)

def test_imports():
    """Test if all required packages are installed."""
    print_header("Testing Package Installation")
    
    required_packages = {
        'speech_recognition': 'SpeechRecognition',
        'pyttsx3': 'pyttsx3',
        'flask': 'Flask',
        'requests': 'requests',
    }
    
    all_ok = True
    for import_name, package_name in required_packages.items():
        try:
            __import__(import_name)
            print(f"✅ {package_name} is installed")
        except ImportError:
            print(f"❌ {package_name} is NOT installed")
            print(f"   Run: pip install {package_name}")
            all_ok = False
    
    return all_ok

def test_config():
    """Test if config file is properly set up."""
    print_header("Checking Configuration")
    
    if not os.path.exists('config.json'):
        print("⚠️  config.json not found")
        print("   This is optional - app will use default settings")
        print("   Create it to add API keys for better AI responses")
        return True
    
    try:
        import json
        with open('config.json', 'r') as f:
            config = json.load(f)
        
        if 'ai_provider' in config:
            print(f"✅ AI Provider: {config['ai_provider']}")
        
        if 'google_api_key' in config and config['google_api_key']:
            print("✅ Google API key configured")
        elif config.get('ai_provider') == 'google':
            print("⚠️  Google API key not configured")
            print("   Add to config.json for better responses")
        
        if 'openai_api_key' in config and config['openai_api_key']:
            print("✅ OpenAI API key configured")
        elif config.get('ai_provider') == 'openai':
            print("⚠️  OpenAI API key not configured")
            print("   Add to config.json for better responses")
        
        return True
    except Exception as e:
        print(f"❌ Error reading config.json: {e}")
        return False

def test_voice_assistant():
    """Test if VoiceAssistant class works."""
    print_header("Testing Voice Assistant")
    
    try:
        from voice_assistant import VoiceAssistant
        print("✅ VoiceAssistant imported successfully")
        
        # Test with voice disabled (won't need microphone)
        assistant = VoiceAssistant(use_voice=False)
        print("✅ VoiceAssistant initialized")
        
        # Test simple response
        response = assistant.get_ai_response("Hello, what is 2+2?")
        if response and len(response) > 0:
            print(f"✅ AI Response works")
            print(f"   Response: {response[:100]}...")
            return True
        else:
            print("❌ No response from AI")
            return False
            
    except Exception as e:
        print(f"❌ Error testing VoiceAssistant: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_cache():
    """Test cache functionality."""
    print_header("Testing Cache System")
    
    try:
        from cache_helper import response_cache
        print("✅ Cache imported successfully")
        
        # Test cache operations
        test_query = "test question"
        test_response = "test response"
        
        response_cache.set(test_query, test_response)
        print("✅ Cache set operation works")
        
        cached = response_cache.get(test_query)
        if cached == test_response:
            print("✅ Cache get operation works")
        else:
            print("❌ Cache retrieval failed")
            return False
        
        stats = response_cache.stats()
        print(f"✅ Cache stats: {stats}")
        response_cache.clear()
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing cache: {e}")
        return False

def test_web_server():
    """Quick test that web server can be imported."""
    print_header("Testing Web Server")
    
    try:
        from app_web import app
        print("✅ Flask app imported successfully")
        
        # Check routes
        if app is not None:
            print("✅ Web server is properly configured")
            return True
        else:
            print("❌ Web server configuration error")
            return False
            
    except Exception as e:
        print(f"❌ Error with web server: {e}")
        return False

def main():
    """Run all tests."""
    print("\n" + "█" * 60)
    print("█" + " " * 58 + "█")
    print("█  MYCHAT APP - System Test Suite" + " " * 24 + "█")
    print("█" + " " * 58 + "█")
    print("█" * 60)
    
    results = {
        'Imports': test_imports(),
        'Config': test_config(),
        'Cache': test_cache(),
        'Voice Assistant': test_voice_assistant(),
        'Web Server': test_web_server(),
    }
    
    # Print summary
    print_header("Test Summary")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print(f"\nResult: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All systems operational! Ready to chat.")
        print("\nStart the web server with:")
        print("  python app_web.py")
        print("\nThen open: http://127.0.0.1:5000")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.")
        print("\nFor help, see: SETUP_GUIDE.md")
        return 1

if __name__ == "__main__":
    sys.exit(main())
