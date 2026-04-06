@echo off
echo Installing Voice Assistant Dependencies...
echo.

echo Installing Python packages...
pip install -r requirements.txt

echo.
echo Installation complete!
echo.
echo To run the voice assistant, use:
echo python voice_assistant.py
echo.
echo Make sure to configure your API keys in config.json if you want to use AI services.
echo.
pause
