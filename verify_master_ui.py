#!/usr/bin/env python3
"""
MYCHAT Master UI - Verification Script
Checks that all files are in place and properly configured
"""

import os
import json
from pathlib import Path

class MasterUIVerifier:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.static_dir = self.project_root / "static"
        self.results = []
        
    def log(self, status, message):
        """Log verification results"""
        symbol = "✅" if status else "❌"
        self.results.append((symbol, message))
        print(f"{symbol} {message}")
    
    def check_file_exists(self, path, description):
        """Check if a file exists"""
        exists = path.exists()
        self.log(exists, f"{description}: {path.name}")
        return exists
    
    def check_file_size(self, path, min_size, description):
        """Check if file has minimum size"""
        if not path.exists():
            self.log(False, f"{description}: File not found")
            return False
        
        size = path.stat().st_size
        ok = size >= min_size
        self.log(ok, f"{description}: {size} bytes (min: {min_size})")
        return ok
    
    def check_file_contains(self, path, text, description):
        """Check if file contains specific text"""
        if not path.exists():
            self.log(False, f"{description}: File not found")
            return False
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                contains = text in content
                self.log(contains, f"{description}: Found '{text[:30]}...'")
                return contains
        except Exception as e:
            self.log(False, f"{description}: Error reading file - {str(e)}")
            return False
    
    def verify_all(self):
        """Run all verification checks"""
        print("\n" + "="*60)
        print("MYCHAT MASTER UI - VERIFICATION SCRIPT")
        print("="*60 + "\n")
        
        # Check HTML files
        print("📄 HTML FILES")
        print("-" * 40)
        self.check_file_exists(self.static_dir / "master.html", "Master UI HTML")
        self.check_file_size(self.static_dir / "master.html", 10000, "Master HTML size")
        self.check_file_contains(self.static_dir / "master.html", 
                                "master-app.js", "Master HTML imports JS")
        self.check_file_contains(self.static_dir / "master.html", 
                                "master.css", "Master HTML imports CSS")
        
        # Check CSS files
        print("\n🎨 CSS FILES")
        print("-" * 40)
        self.check_file_exists(self.static_dir / "css" / "master.css", "Master CSS")
        self.check_file_size(self.static_dir / "css" / "master.css", 20000, "Master CSS size")
        self.check_file_contains(self.static_dir / "css" / "master.css", 
                                "--bg-primary", "Master CSS has variables")
        self.check_file_contains(self.static_dir / "css" / "master.css", 
                                "data-theme", "Master CSS has theme support")
        
        # Check JavaScript files
        print("\n⚙️  JAVASCRIPT FILES")
        print("-" * 40)
        self.check_file_exists(self.static_dir / "js" / "master-app.js", "Master App JS")
        self.check_file_size(self.static_dir / "js" / "master-app.js", 20000, "Master App JS size")
        self.check_file_contains(self.static_dir / "js" / "master-app.js", 
                                "class MasterApp", "Master App has class")
        self.check_file_contains(self.static_dir / "js" / "master-app.js", 
                                "sendMessage", "Master App has sendMessage")
        self.check_file_contains(self.static_dir / "js" / "master-app.js", 
                                "SpeechRecognition", "Master App uses Speech API")
        
        # Check Python files
        print("\n🐍 PYTHON FILES")
        print("-" * 40)
        self.check_file_exists(self.project_root / "app_web.py", "Flask server")
        self.check_file_contains(self.project_root / "app_web.py", 
                                "master.html", "Flask serves master UI")
        self.check_file_contains(self.project_root / "app_web.py", 
                                "/api/chat", "Flask has chat endpoint")
        self.check_file_exists(self.project_root / "voice_assistant.py", "Voice assistant")
        self.check_file_exists(self.project_root / "cache_helper.py", "Cache helper")
        
        # Check documentation files
        print("\n📚 DOCUMENTATION FILES")
        print("-" * 40)
        self.check_file_exists(self.project_root / "MASTER_UI_GUIDE.md", "Master UI Guide")
        self.check_file_exists(self.project_root / "MASTER_UI_QUICK_START.md", "Quick Start")
        self.check_file_exists(self.project_root / "MASTER_UI_ARCHITECTURE.md", "Architecture Doc")
        self.check_file_exists(self.project_root / "IMPLEMENTATION_COMPLETE.md", "Implementation Summary")
        
        # Check Flask configuration
        print("\n🚀 FLASK CONFIGURATION")
        print("-" * 40)
        self.check_file_contains(self.project_root / "app_web.py", 
                                '@app.route("/")', "Flask has root route")
        self.check_file_contains(self.project_root / "app_web.py", 
                                "if __name__", "Flask has main block")
        self.check_file_contains(self.project_root / "app_web.py", 
                                "5000", "Flask configured for port 5000")
        
        # Summary
        print("\n" + "="*60)
        passed = sum(1 for status, _ in self.results if "✅" in status)
        total = len(self.results)
        percentage = (passed / total * 100) if total > 0 else 0
        
        print(f"VERIFICATION SUMMARY: {passed}/{total} checks passed ({percentage:.1f}%)")
        print("="*60)
        
        if passed == total:
            print("\n🎉 ALL CHECKS PASSED! Master UI is ready to use!\n")
            print("Next steps:")
            print("1. Run: python app_web.py")
            print("2. Open: http://127.0.0.1:5000")
            print("3. Start chatting! 🎤💬\n")
            return True
        else:
            print(f"\n⚠️  {total - passed} checks failed. Review the issues above.\n")
            return False
    
    def print_quick_status(self):
        """Print a quick status summary"""
        print("\nQUICK STATUS REPORT:")
        print("-" * 40)
        
        files_ok = all([
            (self.static_dir / "master.html").exists(),
            (self.static_dir / "css" / "master.css").exists(),
            (self.static_dir / "js" / "master-app.js").exists(),
        ])
        
        server_ok = (self.project_root / "app_web.py").exists()
        docs_ok = (self.project_root / "MASTER_UI_GUIDE.md").exists()
        
        print(f"UI Files: {'✅' if files_ok else '❌'}")
        print(f"Server: {'✅' if server_ok else '❌'}")
        print(f"Documentation: {'✅' if docs_ok else '❌'}")
        print(f"Overall: {'✅ READY' if all([files_ok, server_ok, docs_ok]) else '❌ NOT READY'}\n")

def main():
    """Run verification"""
    verifier = MasterUIVerifier()
    
    # Run full verification
    success = verifier.verify_all()
    
    # Print quick status
    verifier.print_quick_status()
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
