from openai import OpenAI
import os
import base64
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
from dotenv import load_dotenv
import pandas as pd
import pdfplumber
import requests
from bs4 import BeautifulSoup
import json
import pickle

# Load environment variables from .env file
load_dotenv()

local_model = None
local_vectorizer = None
try:
    model_path = os.path.join(os.path.dirname(__file__), 'local_model.pkl')
    vec_path = os.path.join(os.path.dirname(__file__), 'local_vectorizer.pkl')
    if os.path.exists(model_path) and os.path.exists(vec_path):
        with open(model_path, 'rb') as f:
            local_model = pickle.load(f)
        with open(vec_path, 'rb') as f:
            local_vectorizer = pickle.load(f)
        print("Loaded fast local ML model for bulk analysis.")
except Exception as e:
    print(f"Could not load local model: {e}")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

client = OpenAI(
  base_url="https://integrate.api.nvidia.com/v1",
  api_key=os.getenv("NVIDIA_API_KEY")
)
# EasyOCR reader will be lazy-loaded only if vision API fails

def detect_user_intent(message):
    """Detect the intent of the user's message"""
    message_lower = message.lower().strip()

    # Greeting patterns
    greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'greetings']
    if any(greeting in message_lower for greeting in greetings) and len(message.split()) <= 5:
        return 'greeting'

    # Casual conversation patterns
    casual_patterns = ['how are you', 'what\'s up', 'how\'s it going', 'what are you doing', 'tell me about yourself', 'who are you']
    if any(pattern in message_lower for pattern in casual_patterns):
        return 'casual'

    # Review-related keywords
    review_keywords = ['review', 'product', 'rating', 'stars', 'bought', 'purchased', 'recommend', 'amazing', 'terrible', 'good', 'bad', 'excellent', 'poor', 'quality', 'price', 'value']
    if any(keyword in message_lower for keyword in review_keywords) or len(message.split()) > 10:
        return 'review'

    # Questions about the bot's capabilities
    capability_questions = ['what can you do', 'how do you work', 'what do you do', 'help', 'features', 'capabilities']
    if any(question in message_lower for question in capability_questions):
        return 'capabilities'

    # Default to review analysis if we can't determine intent
    return 'review'

def handle_greeting():
    """Handle greeting messages"""
    responses = [
        "Hello! I'm FakeSpot AI, your review authenticity detector. How can I help you today?",
        "Hi there! Ready to analyze some reviews? Just paste your review text or upload an image!",
        "Hey! I'm here to help you spot fake reviews. What would you like to check?",
        "Greetings! I'm FakeSpot, your AI-powered review detector. Let's get started!"
    ]
    return responses[hash(str(os.urandom(4))) % len(responses)]

def handle_casual_conversation(message):
    """Handle casual conversation"""
    message_lower = message.lower()

    if 'how are you' in message_lower:
        return "I'm doing great, thanks for asking! I'm always ready to help detect fake reviews. How about you?"

    if 'what\'s up' in message_lower or 'how\'s it going' in message_lower:
        return "Just hanging out and analyzing reviews! Got any suspicious reviews you'd like me to check?"

    if 'tell me about yourself' in message_lower or 'who are you' in message_lower:
        return "I'm FakeSpot AI, an advanced AI system designed to detect fake product reviews. I can analyze both text reviews and images to help you identify genuine vs. fake feedback. Pretty cool, right?"

    if 'what are you doing' in message_lower:
        return "I'm waiting to help you analyze some reviews! You can paste review text or upload images of product reviews."

    return "I'm here to help with review analysis! Feel free to share any reviews you'd like me to check."

def handle_capabilities():
    """Handle questions about capabilities"""
    return """Here's what I can do:

📝 **Text Review Analysis**: Paste any product review text and I'll analyze it for authenticity
🖼️ **Image Review Analysis**: Upload images of reviews and I'll examine them for signs of fakeness
🔍 **Detailed Explanations**: I provide reasoning for my analysis
⚡ **Real-time Detection**: Get instant results

Just paste your review text or upload an image to get started!"""

def detect_fake_review_text(review_text):
    """Analyze text review for fake detection and return structured result"""
    prompt = f"""
    Analyze this product review and determine if it's fake or genuine. 
    Provide your response in JSON format with the following keys:
    - "is_fake": boolean
    - "authenticity_score": number (0-100, where 100 is completely genuine)
    - "reasoning": string (detailed explanation)
    
    Review: '{review_text}'
    """
    
    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=4096,
            temperature=0.3,
        )

        content = response.choices[0].message.content.strip()
        try:
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
                result = json.loads(json_str)
            else:
                result = json.loads(content)
            return result
        except Exception:
            # Fallback if JSON parsing fails
            return {
                "is_fake": "fake" in content.lower(),
                "authenticity_score": 50,
                "reasoning": content
            }
            
    except Exception as api_e:
        print(f"Groq API Error: {api_e}. Falling back to free local model.")
        if local_model and local_vectorizer:
            X = local_vectorizer.transform([str(review_text)])
            pred = bool(local_model.predict(X)[0])
            probs = local_model.predict_proba(X)[0]
            score = int(probs[0] * 100) if len(probs) > 1 else (0 if pred else 100)
            return {
                "is_fake": pred,
                "authenticity_score": score,
                "reasoning": "[Free Offline Mode] Evaluated using your custom-trained local machine learning model due to API limits."
            }
        else:
            return {
                "is_fake": False,
                "authenticity_score": 50,
                "reasoning": f"API Error: {str(api_e)}. (Offline mode unavailable, please run train_local_model.py first)"
            }

def extract_text_from_pdf(file_stream):
    """Extract text from a PDF file"""
    text = ""
    try:
        with pdfplumber.open(file_stream) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"PDF extraction error: {e}")
    return text

def extract_reviews_from_excel(file_stream, filename):
    """Extract reviews from Excel or CSV"""
    try:
        if filename.endswith('.csv'):
            try:
                df = pd.read_csv(file_stream, engine='python', on_bad_lines='skip')
            except Exception:
                file_stream.seek(0)
                df = pd.read_csv(file_stream, encoding='latin1', engine='python', on_bad_lines='skip')
        else:
            df = pd.read_excel(file_stream)
        
        # Look for columns that might contain reviews
        # First check for exact/strong matches
        strong_keywords = ['review text', 'review content', 'comments', 'review_text', 'text']
        for col in df.columns:
            if str(col).lower().strip() in strong_keywords:
                return df[col].dropna().astype(str).tolist()

        keywords = ['review', 'text', 'comment', 'content', 'body', 'message']
        exclude_words = ['date', 'count', 'name', 'id', 'url', 'link', 'author', 'title', 'rating', 'score', 'time', 'profile']
        
        review_cols = []
        for col in df.columns:
            col_lower = str(col).lower()
            if any(kw in col_lower for kw in keywords) and not any(ex in col_lower for ex in exclude_words):
                review_cols.append(col)
                
        if review_cols:
            return df[review_cols[0]].dropna().astype(str).tolist()
        else:
            # If no obvious column, return the first text/object column
            for col in df.columns:
                if df[col].dtype == 'object':
                    return df[col].dropna().astype(str).tolist()
            return df.iloc[:, 0].dropna().astype(str).tolist()
    except Exception as e:
        print(f"Excel extraction error: {e}")
        return []

def scrape_reviews_from_url(url):
    """Scrape review-like content from a URL"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for element in soup(["script", "style"]):
            element.decompose()

        # Get text
        text = soup.get_text()
        
        # Simple cleanup: keep lines with reasonable length (likely reviews)
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if len(chunk) > 30)
        
        return text[:5000] # Limit to first 5000 chars for analysis
    except Exception as e:
        return f"Error scraping URL: {str(e)}"

def detect_fake_review_image(image_data):
    """Analyze product photo for authenticity using Groq Vision API"""
    try:
        # Clean prefix if present
        if "," in image_data:
            image_data = image_data.split(",")[1]

        prompt = '''Analyze this image which contains a product review and/or product photos. If the image shows real-life, amateur photos taken by a customer in a home setting, or if it shows a detailed text review alongside user photos, it is highly likely to be a GENUINE review. Stock photos, overly polished marketing images, or heavily manipulated photos are signs of a fake. Please output your analysis as JSON: {"is_fake": boolean, "authenticity_score": number, "reasoning": "detailed explanation"}'''
        
        response = client.chat.completions.create(
            model="meta/llama-3.2-90b-vision-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}",
                            },
                        },
                    ],
                }
            ],
            max_tokens=400,
            temperature=0.3
        )

        content = response.choices[0].message.content.strip()
        try:
            # Try to find JSON block in case there is text around it
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
                result = json.loads(json_str)
            else:
                result = json.loads(content)
            return result
        except Exception:
            return {
                "is_fake": "fake" in content.lower() or "counterfeit" in content.lower(),
                "authenticity_score": 50,
                "reasoning": content
            }
            
    except Exception as e:
        print(f"Vision error: {str(e)}")
        # Fallback to OCR if vision model fails/unavailable
        try:
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                image.save(tmp.name)
                tmp_path = tmp.name
            
            try:
                import easyocr
                reader = easyocr.Reader(['en'])
                results = reader.readtext(tmp_path)
                extracted_text = "\n".join([text[1] for text in results])
            except ImportError:
                extracted_text = ""
                print("easyocr is not installed. Skipping OCR fallback.")

            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            
            if not extracted_text.strip():
                return {"is_fake": False, "authenticity_score": 50, "reasoning": "No text found in image, and product vision analysis failed (OCR fallback skipped)."}
            
            return detect_fake_review_text(extracted_text)
            
        except Exception as ocr_e:
            return {"is_fake": False, "authenticity_score": 50, "reasoning": f"Error processing image: {str(e)}"}

@app.route('/analyze-text', methods=['POST'])
def analyze_text():
    try:
        data = request.get_json()
        review_text = data.get('text', '').strip()

        if not review_text:
            return jsonify({'error': 'No text provided'}), 400

        # Detect user intent
        intent = detect_user_intent(review_text)

        if intent == 'greeting':
            result = handle_greeting()
        elif intent == 'casual':
            result = handle_casual_conversation(review_text)
        elif intent == 'capabilities':
            result = handle_capabilities()
        else:  # intent == 'review' or default
            analysis = detect_fake_review_text(review_text)
            result = analysis.get('reasoning', str(analysis))

        return jsonify({'result': result, 'type': intent, 'intent': intent, 'analysis': analysis if intent == 'review' else None})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-bulk', methods=['POST'])
def analyze_bulk():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        filename = file.filename
        
        reviews = []
        if filename.endswith('.pdf'):
            text = extract_text_from_pdf(file)
            # Split by common review delimiters if any, or just treat as one big text for now
            reviews = [text] if text else []
        elif filename.endswith(('.xlsx', '.xls', '.csv')):
            reviews = extract_reviews_from_excel(file, filename)
        else:
            return jsonify({'error': 'Unsupported file format'}), 400
        
        if not reviews:
            return jsonify({'error': 'No reviews found in file'}), 400
        
        results = []
        total_score = 0
        
        if local_model and local_vectorizer:
            # Use fast local model to process ALL reviews
            texts = [str(r) for r in reviews]
            X = local_vectorizer.transform(texts)
            preds = local_model.predict(X)
            probs = local_model.predict_proba(X)
            
            for i, review in enumerate(reviews):
                is_fake = bool(preds[i])
                # Prob of class 0 (genuine)
                authenticity_score = int(probs[i][0] * 100) if probs.shape[1] > 1 else (0 if is_fake else 100)
                total_score += authenticity_score
                
                if len(results) < 20: # Limit display to 20
                    results.append({
                        'review': str(review)[:100] + "...",
                        'analysis': {
                            'is_fake': is_fake,
                            'authenticity_score': authenticity_score,
                            'reasoning': "Evaluated by fast local model."
                        }
                    })
            accuracy_percentage = total_score / len(reviews) if reviews else 0
        else:
            # Analyze up to 10 reviews with Groq LLM API
            for review in reviews[:10]:
                analysis = detect_fake_review_text(str(review))
                results.append({
                    'review': str(review)[:100] + "...",
                    'analysis': analysis
                })
                total_score += analysis.get('authenticity_score', 0)
            
            accuracy_percentage = total_score / len(results) if results else 0
        
        return jsonify({
            'results': results,
            'accuracy_percentage': accuracy_percentage,
            'count': len(results),
            'total_found': len(reviews)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-url', methods=['POST'])
def analyze_url():
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'No URL provided'}), 400
            
        content = scrape_reviews_from_url(url)
        if content.startswith("Error"):
            return jsonify({'error': content}), 500
            
        analysis = detect_fake_review_text(content)
        
        return jsonify({
            'result': analysis.get('reasoning', ''),
            'analysis': analysis,
            'type': 'url_analysis'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/compare', methods=['POST'])
def compare_websites():
    try:
        data = request.get_json()
        urls = data.get('urls', []) # List of URLs to compare
        
        if not urls or not isinstance(urls, list):
            return jsonify({'error': 'Provide a list of URLs'}), 400
            
        comparisons = []
        for url in urls[:3]: # Limit to 3 for demo
            content = scrape_reviews_from_url(url)
            analysis = detect_fake_review_text(content)
            comparisons.append({
                'url': url,
                'accuracy_score': analysis.get('authenticity_score', 0),
                'summary': analysis.get('reasoning', '')[:200] + "..."
            })
            
        return jsonify({'comparisons': comparisons})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        image_file = request.files['image']

        # Read image data
        image_data = image_file.read()

        # Convert to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')

        analysis = detect_fake_review_image(image_base64)
        result = analysis.get('reasoning', str(analysis))
        return jsonify({'result': result, 'type': 'image', 'analysis': analysis})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)





#Links, Excel sheet, comparision of diff websites, etc. accuracy percentage of product 

