import os
import pandas as pd
import kagglehub
import pickle
import time
import shutil
from dotenv import load_dotenv
from openai import OpenAI
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# Load environment variables
load_dotenv()
client = OpenAI(
  base_url="https://integrate.api.nvidia.com/v1",
  api_key=os.getenv("NVIDIA_API_KEY")
)

def get_label_from_groq(text):
    """Get a quick Fake (1) or Genuine (0) label from Groq for training purposes"""
    prompt = f"Analyze this product review. Reply with ONLY ONE WORD: 'FAKE' if it looks fake/suspicious, or 'GENUINE' if it looks real. Review: '{text}'"
    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=50,
            temperature=0.1
        )
        result = response.choices[0].message.content.strip().upper()
        return 1 if "FAKE" in result else 0
    except Exception as e:
        print(f"Error labeling: {e}")
        return 0 # Default to genuine if error

def main():
    print("1. Downloading Kaggle dataset 'dongrelaxman/amazon-reviews-dataset'...")
    path = kagglehub.dataset_download("dongrelaxman/amazon-reviews-dataset")
    csv_path = os.path.join(path, "Amazon_Reviews.csv")
    
    # Ensure data directory exists
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # Copy dataset to data folder for UI upload
    dest_path = os.path.join(data_dir, "amazon_reviews.csv")
    shutil.copy(csv_path, dest_path)
    print(f"   -> Copied dataset to {dest_path} for easy UI upload.")

    print("2. Loading dataset...")
    try:
        df = pd.read_csv(csv_path, engine='python', on_bad_lines='skip')
    except Exception as e:
        print(f"Error reading dataset: {e}")
        df = pd.read_csv(csv_path, encoding='latin1', engine='python', on_bad_lines='skip')
    
    # Drop rows without reviews
    df = df.dropna(subset=['Review Text'])
    reviews = df['Review Text'].tolist()
    
    # We will auto-label the first 100 reviews to train our local model
    # (In a real scenario, you would label more, but we do 100 to avoid API limits)
    sample_size = min(100, len(reviews))
    print(f"3. Auto-labeling {sample_size} reviews using Groq LLM...")
    
    texts = []
    labels = []
    
    for i in range(sample_size):
        text = str(reviews[i])
        label = get_label_from_groq(text)
        texts.append(text)
        labels.append(label)
        if (i+1) % 10 == 0:
            print(f"   -> Labeled {i+1}/{sample_size}...")
        time.sleep(0.5) # Slight delay to avoid rate limits
        
    print("4. Training Local Machine Learning Model (TF-IDF + Logistic Regression)...")
    vectorizer = TfidfVectorizer(max_features=2500, stop_words='english', ngram_range=(1, 2))
    print("   -> Injecting synthetic baseline data to ensure a balanced model...")
    synthetic_texts = [
        "This product is a total scam. Do not buy! Fake reviews everywhere.",
        "Worst purchase ever. Broke immediately. The seller paid for 5 star reviews.",
        "Completely counterfeit item. Not as described at all. I want a refund.",
        "I was offered a gift card to leave a 5-star review. This is a fake product.",
        "Terrible quality. Fake fake fake.",
        "Don't buy this trash. Cheap knockoff from China.",
        "Amazing product, exactly as described. Highly recommend!",
        "Very good quality for the price. Fast shipping.",
        "I love this item. It works perfectly and looks great.",
        "Excellent customer service and the product is genuine."
    ]
    synthetic_labels = [1, 1, 1, 1, 1, 1, 0, 0, 0, 0] # 1=Fake, 0=Genuine
    
    texts.extend(synthetic_texts)
    labels.extend(synthetic_labels)
    
    X = vectorizer.fit_transform(texts)
    y = labels

    model = LogisticRegression(class_weight='balanced')
    model.fit(X, y)
    
    print("5. Saving model and vectorizer...")
    model_path = os.path.join(os.path.dirname(__file__), 'local_model.pkl')
    vec_path = os.path.join(os.path.dirname(__file__), 'local_vectorizer.pkl')
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    with open(vec_path, 'wb') as f:
        pickle.dump(vectorizer, f)
        
    print(f"   -> Saved to {model_path} and {vec_path}")
    print("Done! Your backend will now use this fast local model for bulk uploads.")

if __name__ == "__main__":
    main()
