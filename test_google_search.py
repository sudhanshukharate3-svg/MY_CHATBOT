#!/usr/bin/env python3
"""Test BeautifulSoup Google Search functionality"""

import sys
sys.path.insert(0, '.')
from voice_assistant import VoiceAssistant

# Create assistant without voice for testing
assistant = VoiceAssistant(use_voice=False)

# Test queries
test_queries = [
    'what is python?',
    'capital of france',
]

print('🧪 Testing BeautifulSoup Google Search Fallback...\n')

for query in test_queries:
    print(f'❓ Query: {query}')
    response = assistant._get_google_search_response(query)
    if response:
        print(f'✅ Response: {response[:200]}\n')
    else:
        print(f'⚠️  No response found\n')
