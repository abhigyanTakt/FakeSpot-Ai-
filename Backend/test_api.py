import os
from dotenv import load_dotenv
from openai import OpenAI
import json

load_dotenv()

client = OpenAI(
  base_url="https://integrate.api.nvidia.com/v1",
  api_key=os.getenv("NVIDIA_API_KEY")
)

def test_text_model():
    print("Testing Text Model (meta/llama-3.1-8b-instruct)...")
    prompt = """
    Analyze this product review and determine if it's fake or genuine. 
    Provide your response in JSON format with the following keys:
    - "is_fake": boolean
    - "authenticity_score": number (0-100)
    - "reasoning": string
    
    Review: 'This product is amazing, changed my life entirely!'
    """
    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3,
        )
        content = response.choices[0].message.content.strip()
        print(f"Success! Response content:\n{content}\n")
    except Exception as e:
        print(f"Error with text model: {e}\n")

def test_vision_model():
    print("Testing Vision Model (meta/llama-3.2-90b-vision-instruct)...")
    # minimal 1x1 pixel base64 jpeg
    dummy_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    prompt = "Is this image fake? Reply JSON."
    try:
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
                                "url": f"data:image/jpeg;base64,{dummy_image}",
                            },
                        },
                    ],
                }
            ],
            max_tokens=100,
            temperature=0.3
        )
        content = response.choices[0].message.content.strip()
        print(f"Success! Response content:\n{content}\n")
    except Exception as e:
        print(f"Error with vision model: {e}\n")

if __name__ == "__main__":
    if not os.getenv("NVIDIA_API_KEY"):
        print("Error: NVIDIA_API_KEY not found in .env file.")
    else:
        test_text_model()
        test_vision_model()
