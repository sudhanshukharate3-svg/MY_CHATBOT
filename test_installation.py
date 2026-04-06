#!/usr/bin/env python3
"""
Test script to verify voice assistant installation
Run this before using the main voice assistant
"""

import sys
import importlib

def test_import(module_name, package_name=None):
    """Test if a module can be imported."""
    try:
        if package_name:
            importlib.import_module(module_name, package_name)
        else:
            importlib.import_module(module_name)
        print(f"✅ {module_name} - OK")
        return True
    except ImportError as e:
        print(f"❌ {module_name} - FAILED: {e}")
        return False

def test_microphone():
    """Test if microphone is available."""
    try:
        import speech_recognition as sr
        r = sr.Recognizer()
        mic = sr.Microphone()
        print("✅ Microphone - OK")
        return True
    except Exception as e:
        print(f"❌ Microphone - FAILED: {e}")
        return False

def test_tts():
    """Test if text-to-speech is working."""
    try:
        import pyttsx3
        engine = pyttsx3.init()
        print("✅ Text-to-Speech - OK")
        return True
    except Exception as e:
        print(f"❌ Text-to-Speech - FAILED: {e}")
        return False

def main():
    """Run all tests."""
    print("=" * 50)
    print("🔍 Voice Assistant Installation Test")
    print("=" * 50)
    
    tests_passed = 0
    total_tests = 0
    
    # Test Python version
    print(f"Python version: {sys.version}")
    if sys.version_info >= (3, 7):
        print("✅ Python version - OK")
        tests_passed += 1
    else:
        print("❌ Python version - FAILED (requires 3.7+)")
    total_tests += 1
    
    print("\nTesting required modules:")
    
    # Test required modules
    modules = [
        "speech_recognition",
        "pyttsx3", 
        "requests",
        "json",
        "os",
        "time",
        "logging"
    ]
    
    for module in modules:
        if test_import(module):
            tests_passed += 1
        total_tests += 1
    
    print("\nTesting hardware:")
    
    # Test microphone
    if test_microphone():
        tests_passed += 1
    total_tests += 1
    
    # Test TTS
    if test_tts():
        tests_passed += 1
    total_tests += 1
    
    print("\n" + "=" * 50)
    print(f"Test Results: {tests_passed}/{total_tests} passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! Your voice assistant is ready to use.")
        print("\nTo start the voice assistant, run:")
        print("python voice_assistant.py")
    else:
        print("⚠️  Some tests failed. Please install missing dependencies:")
        print("pip install -r requirements.txt")
        print("\nFor PyAudio issues on Windows:")
        print("pip install pipwin")
        print("pipwin install pyaudio")
    
    print("=" * 50)

if __name__ == "__main__":
    main()
