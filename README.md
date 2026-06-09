# FakeSpot AI - Conversational Review Detector (Prototype) 🤖

> 💡 **Developer's Note:** I didn't fully know what I was doing at the start of this project, but I am learning step-by-step by partnering with AI—much like a pilot reading the flight manual to plot a course while already in mid-air. ✈️🤖
<img width="523" height="376" alt="image" src="https://github.com/user-attachments/assets/5081de8c-74cb-4cf1-aa47-ead2b27e4e62" />

An advanced AI-powered system that detects fake reviews through both text analysis and image recognition, with full conversational capabilities.


## ✨ Features

### 🎯 **Smart Intent Detection**
- **Greetings**: Responds naturally to hellos and introductions
- **Casual Chat**: Handles questions like "How are you?" and "What do you do?"
- **Capabilities**: Explains what the bot can do when asked
- **Review Analysis**: Automatically detects and analyzes review content

### 📝 **Text Review Analysis**
- Uses GPT-4o-mini for intelligent fake review detection
- Analyzes language patterns, sentiment, and authenticity indicators
- Provides detailed explanations with reasoning

### 🖼️ **Image Review Analysis**
- Upload images for AI-powered authenticity analysis
- Detects stock photos vs. real user images
- Analyzes lighting, composition, and promotional setups

### 💬 **Conversational Interface**
- Interactive chat with typing indicators
- Cursor-responsive 3D robot background
- Real-time responses with engaging animations

## 🚀 Quick Start

### Backend Setup
```bash
cd Backend
pip install -r requirements.txt
python review.py
```
Server runs on `http://localhost:5000`

### Frontend
Open `Frontend/review.html` in your browser

## 🎮 How to Use

### Chat with the Bot
- **Say Hello**: "Hi!", "Hello!", "Hey there!"
- **Ask Questions**: "How are you?", "What can you do?"
- **Get Help**: "Help", "What are your features?"

### Analyze Reviews
- **Text Reviews**: Paste any product review text
- **Image Reviews**: Click the image icon to upload review screenshots

### Example Conversations
```
You: Hello!
Bot: Hi there! Ready to analyze some reviews? Just paste your review text or upload an image!

You: How are you?
Bot: I'm doing great, thanks for asking! I'm always ready to help detect fake reviews. How about you?

You: This product is amazing!
Bot: [Detailed analysis of whether the review appears genuine or fake]
```

## 🛠️ Technical Details

- **Backend**: Flask API with OpenAI GPT-4o-mini
- **Frontend**: Vanilla HTML/CSS/JavaScript with Spline 3D backgrounds
- **AI Models**: GPT-4o-mini for text, GPT-4o-mini vision for images
- **Security**: API keys stored in environment variables

## 📋 API Endpoints

- `POST /analyze-text` - Analyze text reviews
- `POST /analyze-image` - Analyze image reviews
- `GET /health` - Health check

## 🔧 Configuration

Create a `.env` file in the Backend folder:
```
OPENAI_API_KEY=your_api_key_here
```

## 🎨 Features

- **Interactive Robot**: Background responds to cursor movement
- **Typing Animations**: Dynamic typing indicators
- **Responsive Design**: Works on all screen sizes
- **Real-time Analysis**: Instant AI-powered responses
- **Image Upload**: Drag-and-drop or click to upload images

Enjoy chatting with your AI review detective! 🕵️‍♂️


(it is prototype that's why i am using html or kinda lazy who knows)
