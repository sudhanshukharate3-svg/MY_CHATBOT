#!/usr/bin/env python3
"""
MYCHAT APP - A complete voice-controlled AI assistant
Supports speech input/output with multiple AI backends (OpenAI, Google Gemini)
Includes web scraping fallback with BeautifulSoup
"""

import speech_recognition as sr
import pyttsx3
import requests
import json
import os
import time
import threading
from typing import Optional, Dict, Any, Tuple
import logging
import webbrowser

# Web scraping imports
try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

# Import cache helper
try:
    from cache_helper import response_cache
except ImportError:
    response_cache = None

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class VoiceAssistant:
    def __init__(self, use_voice: bool = True):
        """Initialize MYCHAT APP. Set use_voice=False for API-only (e.g. web UI) to skip mic/TTS."""
        self.ai_config = self._load_ai_config()
        self.use_voice = use_voice
        self.recognizer = None
        self.microphone = None
        self.tts_engine = None
        if use_voice:
            self.recognizer = sr.Recognizer()
            self.microphone = sr.Microphone()
            self.tts_engine = pyttsx3.init()
            self._configure_tts()
            self._calibrate_microphone()
        logger.info("MYCHAT APP initialized successfully!")

    def _configure_tts(self) -> None:
        if self.tts_engine is None:
            return
        """Configure the text-to-speech engine for a clear female voice."""
        voices = self.tts_engine.getProperty('voices')
        female_keywords = ('zira', 'female', 'woman', 'hazel', 'sabina', 'susan', 'victoria', 'kate', 'linda', 'maria', 'elena')
        male_keywords = ('david', 'male', 'man', 'james', 'mark', 'paul')
        chosen_voice = None
        fallback_voice = None
        if voices:
            for voice in voices:
                name_lower = voice.name.lower()
                id_lower = (voice.id or "").lower()
                # Prefer female voice: match by name or ID (e.g. TTS_MS_EN-US_ZIRA_11.0)
                if any(k in name_lower or k in id_lower for k in female_keywords):
                    chosen_voice = voice.id
                    break
                if fallback_voice is None and not any(k in name_lower or k in id_lower for k in male_keywords):
                    fallback_voice = voice.id
            voice_id = chosen_voice or fallback_voice or voices[0].id
            self.tts_engine.setProperty('voice', voice_id)
            logger.info(f"Using TTS voice: {voice_id}")
        # Clear, natural pace and full volume for spoken responses
        self.tts_engine.setProperty('rate', 165)   # Slightly slower for clarity
        self.tts_engine.setProperty('volume', 1.0)  # Full volume

    def _load_ai_config(self) -> Dict[str, Any]:
        """Load AI configuration from config.json file."""
        config_file = 'config.json'
        default_config = {
            "openai_api_key": "",
            "google_api_key": "",
            "google_search_api_key": "",
            "google_search_engine_id": "",
            "ai_provider": "google_search",  # Options: "openai", "google", "google_search", "simple"
            "openai_model": "gpt-3.5-turbo",
            "google_model": "gemini-pro"
        }
        
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    config = json.load(f)
                logger.info("Configuration loaded from config.json")
                return {**default_config, **config}
            except Exception as e:
                logger.warning(f"Error loading config.json: {e}. Using default configuration.")
        else:
            logger.info("No config.json found. Using default configuration.")
        
        return default_config

    def _calibrate_microphone(self) -> None:
        """Calibrate the microphone for ambient noise."""
        if self.microphone is None:
            return
        logger.info("Calibrating microphone for ambient noise...")
        with self.microphone as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=1)
        logger.info("Microphone calibration complete!")

    def listen(self) -> Optional[str]:
        """
        Listen for voice input and return the recognized text.
        Returns None if recognition fails or user says stop command.
        Implements robust error handling and auto-retry logic.
        """
        if not self.use_voice or self.microphone is None:
            return ""
        
        retry_count = 0
        max_retries = 2
        
        while retry_count <= max_retries:
            try:
                logger.info(f"Listening... Speak now! (Attempt {retry_count + 1}/{max_retries + 1})")
                
                with self.microphone as source:
                    # Increase timeout to allow for longer phrases
                    # phrase_time_limit allows continuous speech for up to 15 seconds
                    audio = self.recognizer.listen(
                        source, 
                        timeout=8,  # Wait up to 8 seconds for speech to start
                        phrase_time_limit=15  # Allow speaking for up to 15 seconds
                    )
                
                logger.info("Processing speech...")
                
                # Use Google Speech Recognition with exception handling
                try:
                    text = self.recognizer.recognize_google(audio)
                except sr.UnknownValueError:
                    logger.warning("Could not understand the audio - retrying")
                    retry_count += 1
                    if retry_count <= max_retries:
                        self.speak("I'm sorry, I didn't catch that. Please speak again clearly.")
                        continue
                    else:
                        self.speak("I'm having trouble understanding you. Please try typing your message instead.")
                        return ""
                
                text = text.lower().strip()
                
                if not text:
                    logger.warning("Recognized empty text")
                    retry_count += 1
                    if retry_count <= max_retries:
                        self.speak("I didn't hear anything. Please speak again.")
                        continue
                    else:
                        return ""
                
                logger.info(f"Recognized: {text}")
                
                # Check for stop commands
                stop_commands = ['exit', 'quit', 'stop', 'goodbye', 'bye', 'end']
                if any(cmd in text for cmd in stop_commands):
                    return None
                
                return text
                
            except sr.WaitTimeoutError:
                logger.warning("No speech detected within timeout period")
                retry_count += 1
                if retry_count <= max_retries:
                    self.speak("I didn't hear anything. Please speak now.")
                    continue
                else:
                    return ""
                    
            except sr.RequestError as e:
                logger.error(f"Speech recognition service error: {e}")
                self.speak("I'm having trouble connecting to the speech service. Please check your internet connection.")
                return ""
                
            except Exception as e:
                logger.error(f"Unexpected error during speech recognition: {e}")
                retry_count += 1
                if retry_count <= max_retries:
                    self.speak("An error occurred. Let me try again.")
                    continue
                else:
                    return ""
        
        return ""

    def speak(self, text: str) -> None:
        """Convert text to speech and play it."""
        if not self.use_voice or self.tts_engine is None:
            return
        try:
            logger.info(f"Speaking: {text}")
            self.tts_engine.say(text)
            self.tts_engine.runAndWait()
        except Exception as e:
            logger.error(f"Error in text-to-speech: {e}")

    def get_ai_response(self, query: str) -> str:
        """
        Get AI response based on the configured provider.
        Uses caching to reduce API calls.
        Falls back through: OpenAI → Google Gemini → Google Search → Simple response
        """
        # Check cache first
        if response_cache:
            cached_response = response_cache.get(query)
            if cached_response:
                logger.info(f"Cache hit for query: {query[:50]}...")
                return cached_response
        
        response = None
        
        # Try primary provider
        if self.ai_config["ai_provider"] == "openai":
            response = self._get_openai_response(query)
        elif self.ai_config["ai_provider"] == "google":
            response = self._get_google_response(query)
        elif self.ai_config["ai_provider"] == "google_search":
            response = self._get_google_search_response(query)
        
        # Fallback chain if primary failed
        if not response:
            logger.info(f"Primary provider failed, trying Google Search...")
            response = self._get_google_search_response(query)
        
        if not response:
            logger.info(f"Google Search failed, trying simple response...")
            response = self._get_simple_response(query)
        
        # Cache the response
        if response_cache and response:
            response_cache.set(query, response)
        
        return response

    def _get_openai_response(self, query: str) -> str:
        """Get response from OpenAI API."""
        if not self.ai_config["openai_api_key"]:
            return "OpenAI API key not configured. Please add your API key to config.json"
        
        try:
            headers = {
                "Authorization": f"Bearer {self.ai_config['openai_api_key']}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": self.ai_config["openai_model"],
                "messages": [
                    {"role": "system", "content": "You are MYCHAT APP, a helpful voice assistant. Keep responses concise and conversational."},
                    {"role": "user", "content": query}
                ],
                "max_tokens": 150,
                "temperature": 0.7
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"].strip()
            else:
                logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                return "Sorry, I'm having trouble connecting to the AI service right now."
                
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}")
            return "Sorry, I encountered an error while processing your request."

    def _get_google_response(self, query: str) -> str:
        """Get response from Google Gemini API (SDK first, then REST with model fallback)."""
        if not self.ai_config["google_api_key"]:
            return "Google API key not configured. Please add your API key to config.json"
        # Prefer official current SDK when available (google-genai)
        sdk_error = None
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.ai_config["google_api_key"].strip())
            prompt = (
                "You are MYCHAT APP, a helpful assistant. Give clear, complete, professional answers. "
                "Be concise but informative. Answer directly.\n\nUser: " + query
            )
            model_names = [
                self.ai_config.get("google_model"),
                "gemini-2.0-flash",
                "gemini-1.5-flash",
                "gemini-1.5-pro",
                "gemini-pro",
            ]
            seen_models = set()
            for name in model_names:
                if not name or name in seen_models:
                    continue
                seen_models.add(name)
                try:
                    resp = client.models.generate_content(
                        model=name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            max_output_tokens=1024,
                            temperature=0.7,
                        ),
                    )
                    text = getattr(resp, "text", None)
                    if text:
                        return text.strip()
                except Exception as e:
                    sdk_error = str(e)
                    logger.warning(f"Gemini SDK model {name} failed: {sdk_error}")
                    # If quota is 0 / billing not enabled, surface immediately (no model will work)
                    if "Quota exceeded" in sdk_error or "exceeded your current quota" in sdk_error or "limit: 0" in sdk_error:
                        return (
                            "Gemini API quota is not available for this API key/project (free-tier limit is 0). "
                            "Enable billing/quotas in Google AI Studio (or create a new project/key with quota), "
                            "then try again."
                        )
                    continue
        except ImportError:
            pass
        # Fallback: REST API with model list
        models_to_try = [
            self.ai_config.get("google_model"),
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-pro",
        ]
        seen = set()
        last_error = None
        for model in models_to_try:
            if not model or model in seen:
                continue
            seen.add(model)
            result, err = self._call_gemini_api(query, model)
            if result is not None:
                return result
            if err:
                last_error = err
        if last_error:
            return f"Sorry, the AI service couldn't respond. {last_error}"
        if sdk_error:
            return f"Sorry, the AI service couldn't respond. {sdk_error}"
        return "Sorry, I'm having trouble connecting to the AI service. Please check your API key in config.json and try again."

    def _call_gemini_api(self, query: str, model: str) -> Tuple[Optional[str], Optional[str]]:
        """Call Gemini API. Returns (response_text, None) on success, (None, user_friendly_error) on failure."""
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            api_key = self.ai_config["google_api_key"].strip()
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": api_key,
            }
            prompt = (
                "You are MYCHAT APP, a helpful female voice assistant. "
                "Give clear, complete, professional answers. Be concise but informative. "
                "Answer the user's question directly and helpfully.\n\nUser: " + query
            )
            data = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "maxOutputTokens": 1024,
                    "temperature": 0.7
                }
            }
            response = requests.post(
                f"{url}?key={api_key}",
                headers=headers,
                json=data,
                timeout=20
            )
            if response.status_code == 200:
                result = response.json()
                cands = result.get("candidates", [])
                if not cands:
                    return None, "No response from model."
                c = cands[0]
                if c.get("finishReason") not in (None, "STOP", "MAX_TOKENS"):
                    return None, "Response was blocked or incomplete."
                if "content" not in c or "parts" not in c["content"] or not c["content"]["parts"]:
                    return None, "Empty response from model."
                text = c["content"]["parts"][0].get("text", "").strip()
                if not text:
                    return None, "Empty response from model."
                return text, None
            if response.status_code == 404:
                try:
                    err_body = response.json()
                    msg = err_body.get("error", {}).get("message", "Model not found.")
                except Exception:
                    msg = "Model not found."
                logger.warning(f"Model {model} not found: {msg}")
                return None, None
            if response.status_code == 403:
                return None, "Access denied. Check that your Google API key is valid and Gemini API is enabled."
            if response.status_code == 429:
                return None, "Too many requests. Please wait a moment and try again."
            if response.status_code == 401:
                return None, "Invalid API key. Check config.json."
            try:
                err_body = response.json()
                msg = err_body.get("error", {}).get("message", response.text[:200])
            except Exception:
                msg = response.text[:200] if response.text else f"HTTP {response.status_code}"
            logger.error(f"Google API error: {response.status_code} - {msg}")
            return None, f"API error: {msg}"
        except requests.exceptions.Timeout:
            return None, "Request timed out. Try again."
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Google API ({model}): {e}")
            return None, "Network error. Check your internet connection."
        except Exception as e:
            logger.error(f"Error calling Google API ({model}): {e}")
            return None, str(e)

    def _get_google_search_response(self, query: str) -> str:
        """Get response from Google Custom Search API. Fetches real search results."""
        api_key = self.ai_config.get("google_search_api_key", "").strip()
        search_engine_id = self.ai_config.get("google_search_engine_id", "").strip()
        
        # If no Google Search API configured, return None to use fallback
        if not api_key or not search_engine_id:
            logger.info("Google Search API not configured. Skipping.")
            return None
        
        try:
            # Call Google Custom Search API
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                "key": api_key,
                "cx": search_engine_id,
                "q": query,
                "num": 3  # Get top 3 results
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                
                if items:
                    # Format search results into a readable response
                    results = []
                    for i, item in enumerate(items[:2], 1):  # Use top 2 results
                        title = item.get("title", "")
                        snippet = item.get("snippet", "")
                        results.append(f"{i}. {title}: {snippet}")
                    
                    formatted_response = f"Based on search results:\n\n" + "\n\n".join(results)
                    return formatted_response[:500]  # Limit length for voice output
                else:
                    return "No search results found. Please try a different query."
            
            elif response.status_code == 403:
                logger.warning("Google Search API quota exceeded or invalid credentials")
                return None  # Fall back to simple response
            
            else:
                logger.warning(f"Google Search API error: {response.status_code}")
                return None
                
        except requests.exceptions.Timeout:
            logger.warning("Google Search API request timed out")
            return None
        except Exception as e:
            logger.warning(f"Error using Google Search API: {e}")
            return None

    def _get_google_search_response(self, query: str) -> Optional[str]:
        """
        Get response by scraping Google search results using BeautifulSoup.
        This works without API keys!
        Falls back to Wikipedia and other sources if needed.
        """
        if not BeautifulSoup:
            logger.warning("BeautifulSoup not installed. Install with: pip install beautifulsoup4 lxml")
            return None
        
        # Try multiple sources for robustness
        sources = [
            self._search_google(query),
            self._search_wikipedia(query),
            self._search_duckduckgo(query),
        ]
        
        for result in sources:
            if result:
                return result
        
        return None
    
    def _search_google(self, query: str) -> Optional[str]:
        """Search Google and extract results"""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            url = f"https://www.google.com/search?q={query}"
            response = requests.get(url, headers=headers, timeout=5)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try to get answer from knowledge panel
            for div in soup.find_all('div', class_='kno-rdesc'):
                text = div.get_text(strip=True)
                if text and len(text) > 50:
                    logger.info(f"Google knowledge panel: {text[:100]}...")
                    return text[:500]
            
            # Get first meaningful snippet
            for div in soup.find_all('div', class_='VwiC3b'):
                text = div.get_text(strip=True)
                if text and len(text) > 50:
                    logger.info(f"Google snippet: {text[:100]}...")
                    return text[:500]
            
            return None
        except Exception as e:
            logger.debug(f"Google search failed: {e}")
            return None
    
    def _search_wikipedia(self, query: str) -> Optional[str]:
        """Search Wikipedia as a reliable source"""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            url = f"https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=&explaintext=&titles={query}"
            response = requests.get(url, headers=headers, timeout=5)
            data = response.json()
            
            pages = data.get('query', {}).get('pages', {})
            for page_id, page in pages.items():
                if 'extract' in page:
                    text = page['extract']
                    if text and len(text) > 50:
                        logger.info(f"Wikipedia result: {text[:100]}...")
                        return text[:500]
            
            return None
        except Exception as e:
            logger.debug(f"Wikipedia search failed: {e}")
            return None
    
    def _search_duckduckgo(self, query: str) -> Optional[str]:
        """Search DuckDuckGo as another source"""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            url = "https://api.duckduckgo.com/"
            params = {
                "q": query,
                "format": "json",
                "no_redirect": 1,
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=5)
            data = response.json()
            
            # Try instant answer first
            if data.get('Answer'):
                answer = data['Answer']
                if len(answer) > 20:
                    logger.info(f"DuckDuckGo instant answer: {answer[:100]}...")
                    return answer[:500]
            
            # Try abstract
            if data.get('AbstractText'):
                abstract = data['AbstractText']
                if len(abstract) > 50:
                    logger.info(f"DuckDuckGo abstract: {abstract[:100]}...")
                    return abstract[:500]
            
            # Try related topics
            if data.get('RelatedTopics'):
                for topic in data['RelatedTopics'][:3]:
                    if isinstance(topic, dict) and topic.get('Text'):
                        text = topic['Text']
                        if len(text) > 50:
                            logger.info(f"DuckDuckGo topic: {text[:100]}...")
                            return text[:500]
            
            # Try definition
            if data.get('Definition'):
                definition = data['Definition']
                if len(definition) > 20:
                    logger.info(f"DuckDuckGo definition: {definition[:100]}...")
                    return definition[:500]
            
            return None
        except Exception as e:
            logger.debug(f"DuckDuckGo search failed: {e}")
            return None

    def _get_simple_response(self, query: str) -> str:
        """Get simple rule-based response for basic queries."""
        query_lower = query.lower()
        
        # Greeting responses
        if any(word in query_lower for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']):
            return "Hello! I'm MYCHAT APP. I can help you with questions about technology, science, general knowledge, tell you the time, or just have a conversation. What would you like to know?"
        
        # How are you responses
        elif any(phrase in query_lower for phrase in ['how are you', 'how r u', 'how do you do']):
            return "I'm doing great, thank you for asking! I'm here and ready to help you with any questions you might have. How can I assist you today?"
        
        # Time queries
        elif 'time' in query_lower:
            current_time = time.strftime("%I:%M %p")
            return f"The current time is {current_time}"
        
        # Date queries
        elif 'date' in query_lower:
            current_date = time.strftime("%B %d, %Y")
            return f"Today's date is {current_date}"
        
        # AI related queries
        elif 'ai' in query_lower or 'artificial intelligence' in query_lower:
            return "Artificial Intelligence, or AI, is a branch of computer science that focuses on creating machines and software that can perform tasks that typically require human intelligence. This includes things like learning, problem-solving, pattern recognition, and decision-making. AI is used in many areas like voice assistants, image recognition, recommendation systems, and autonomous vehicles."
        
        # Computer related queries
        elif 'computer' in query_lower:
            return "A computer is an electronic device that processes data according to instructions given to it. It can perform calculations, store information, and execute programs. Computers consist of hardware components like the CPU, memory, and storage, along with software that tells the hardware what to do. They're used for everything from basic tasks like word processing to complex operations like scientific simulations."
        
        # Data science queries
        elif 'data science' in query_lower:
            return "Data science is an interdisciplinary field that uses scientific methods, processes, algorithms, and systems to extract knowledge and insights from data. It combines statistics, computer science, and domain expertise to analyze and interpret complex data. Data scientists use tools like Python, R, machine learning, and big data technologies to solve real-world problems."
        
        # Computer vision queries
        elif 'computer vision' in query_lower or 'vision' in query_lower:
            return "Computer vision is a field of artificial intelligence that trains computers to interpret and understand the visual world. It enables machines to identify and process objects in images and videos, just like humans do. Applications include facial recognition, medical image analysis, autonomous vehicles, augmented reality, and quality control in manufacturing."
        
        # Technology queries
        elif any(word in query_lower for word in ['technology', 'tech', 'programming', 'coding', 'software']):
            return "Technology refers to the application of scientific knowledge for practical purposes. In computing, this includes programming languages, software development, hardware design, and digital systems. Programming involves writing code to create software applications, websites, and digital solutions. Popular programming languages include Python, JavaScript, Java, and C++."
        
        # Weather queries
        elif 'weather' in query_lower:
            return "I don't have access to real-time weather data, but I can open a weather website for you. Would you like me to open Weather.com in your browser?"
        
        # Search queries
        elif any(word in query_lower for word in ['search', 'look up', 'find', 'google']):
            search_query = query_lower.replace('search', '').replace('look up', '').replace('find', '').replace('google', '').strip()
            if search_query:
                search_url = f"https://www.google.com/search?q={search_query.replace(' ', '+')}"
                webbrowser.open(search_url)
                return f"I've opened a Google search for '{search_query}' in your browser. You should see the results shortly."
            else:
                return "What would you like me to search for? Just say 'search' followed by your question."
        
        # Help queries
        elif 'help' in query_lower:
            return "I can help you with questions about technology, science, programming, artificial intelligence, data science, computer vision, and general knowledge. I can also tell you the current time and date, search the web for you, or open websites. Just ask me anything you'd like to know about!"
        
        # Open website queries
        elif any(word in query_lower for word in ['open', 'go to', 'visit']):
            if 'youtube' in query_lower:
                webbrowser.open('https://www.youtube.com')
                return "I've opened YouTube for you!"
            elif 'google' in query_lower:
                webbrowser.open('https://www.google.com')
                return "I've opened Google for you!"
            elif 'github' in query_lower:
                webbrowser.open('https://www.github.com')
                return "I've opened GitHub for you!"
            elif 'stackoverflow' in query_lower or 'stack overflow' in query_lower:
                webbrowser.open('https://www.stackoverflow.com')
                return "I've opened Stack Overflow for you!"
            else:
                return "I can open YouTube, Google, GitHub, or Stack Overflow for you. Just say 'open' followed by the website name."
        
        # Programming language queries
        elif any(lang in query_lower for lang in ['python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust']):
            lang = next((l for l in ['python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust'] if l in query_lower), 'programming language')
            if lang == 'python':
                return "Python is a high-level, interpreted programming language known for its simple syntax and readability. It's widely used in web development, data science, AI, machine learning, and automation. Python has a large standard library and many third-party packages like NumPy, Pandas, and Django."
            elif lang == 'javascript':
                return "JavaScript is a programming language that runs in web browsers and on servers. It's essential for web development, allowing you to create interactive websites, mobile apps, and server-side applications. Popular frameworks include React, Angular, and Node.js."
            elif lang == 'java':
                return "Java is a class-based, object-oriented programming language designed to have as few implementation dependencies as possible. It's used for enterprise applications, Android development, and large-scale systems. Java runs on the Java Virtual Machine (JVM)."
            else:
                return f"{lang.title()} is a programming language with its own strengths and use cases. It's used in various applications from web development to system programming."
        
        # Episode queries (from your test)
        elif 'episode' in query_lower:
            return "I'd be happy to help you with information about episodes! Are you asking about a specific TV show, podcast, or series? Please let me know which show or content you're interested in, and I can provide more specific information."
        
        # Default response with more helpful suggestions
        else:
            return f"I understand you're asking about '{query}'. While I don't have a specific answer for that, I can help you with topics like technology, science, programming, AI, data science, computer vision, or general questions. Could you rephrase your question or ask about something else I might be able to help with?"

    def run(self):
        """Main loop for MYCHAT APP."""
        self.speak("Hello! I'm MYCHAT APP. I can help you with questions about technology, science, programming, AI, data science, computer vision, tell you the time and date, search the web, or open websites. How can I help you today?")
        
        while True:
            try:
                # Listen for user input
                user_input = self.listen()
                
                # Check if user wants to exit
                if user_input is None:
                    self.speak("Goodbye! Have a great day!")
                    break
                
                # Skip empty inputs
                if not user_input:
                    continue
                
                # Get AI response
                logger.info(f"Processing query: {user_input}")
                response = self.get_ai_response(user_input)
                
                # Speak the response
                self.speak(response)
                
            except KeyboardInterrupt:
                logger.info("MYCHAT APP stopped by user")
                self.speak("Goodbye!")
                break
            except Exception as e:
                logger.error(f"Unexpected error in main loop: {e}")
                self.speak("Sorry, I encountered an error. Let's try again.")
                continue

def main():
    """Main function to run MYCHAT APP."""
    print("=" * 50)
    print("MYCHAT APP Starting...")
    print("=" * 50)
    print("Make sure you have:")
    print("1. A working microphone")
    print("2. Internet connection (for AI responses)")
    print("3. Required packages installed")
    print("4. API keys configured (if using AI services)")
    print("\nSay 'exit', 'quit', or 'goodbye' to stop the assistant")
    print("=" * 50)
    
    try:
        assistant = VoiceAssistant()
        assistant.run()
    except Exception as e:
        logger.error(f"Failed to start MYCHAT APP: {e}")
        print(f"Error: {e}")
        print("Please check your microphone and try again.")

if __name__ == "__main__":
    main()
