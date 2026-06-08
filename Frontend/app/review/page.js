'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Link from 'next/link';

const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false });

export default function Review() {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! I\'m here to help you detect fake reviews. Please paste a review text, and I\'ll analyze it for you.', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const newMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages([...messages, newMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await analyzeReview(input);
      const botMessage = { id: Date.now() + 1, text: response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = { id: Date.now() + 1, text: `Error analyzing review: ${error.message}`, sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const analyzeReview = async (review) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fakespot-ai.onrender.com';
      const response = await fetch(`${apiUrl}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_text: review }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.prediction === 'fake') {
        return `This review appears to be FAKE (Confidence: ${(data.confidence * 100).toFixed(1)}%). ${data.explanation || 'It contains patterns common in fake reviews.'}`;
      } else if (data.prediction === 'genuine') {
        return `This review appears to be GENUINE (Confidence: ${(data.confidence * 100).toFixed(1)}%). ${data.explanation || 'It uses language typical of real customer feedback.'}`;
      } else {
        return `Analysis Result: ${data.prediction} (Confidence: ${(data.confidence * 100).toFixed(1)}%). ${data.explanation || 'Unable to determine with certainty.'}`;
      }
    } catch (error) {
      console.error('API Error:', error);
      // Fallback to local analysis
      const fakeIndicators = ['amazing', 'best', 'perfect', 'love it', 'highly recommend'];
      const realIndicators = ['good', 'okay', 'average', 'decent'];

      const lowerReview = review.toLowerCase();
      let fakeScore = 0;
      let realScore = 0;

      fakeIndicators.forEach(word => {
        if (lowerReview.includes(word)) fakeScore++;
      });

      realIndicators.forEach(word => {
        if (lowerReview.includes(word)) realScore++;
      });

      if (fakeScore > realScore) {
        return "This review appears to be FAKE. It contains overly positive language that is common in fake reviews. (Offline Mode)";
      } else if (realScore > fakeScore) {
        return "This review appears to be GENUINE. It uses balanced language typical of real customer feedback. (Offline Mode)";
      } else {
        return "This review is UNCERTAIN. It doesn't strongly match patterns of fake or genuine reviews. (Offline Mode)";
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      sendMessage();
    }
  };

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', background: 'transparent' }}>
      <Spline
        scene="https://my.spline.design/nexbotrobotcharacterconcept-EYYDbSvQRzK70oIdK0a6pvcz/"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}
      />
      <nav style={{
        position: 'fixed',
        width: '100%',
        padding: '25px 5%',
        display: 'flex',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        fontWeight: 600,
        fontSize: '1.1rem'
      }}>
        <div>FakeSpot</div>
        <div>AI-Powered Review Detection</div>
      </nav>
      <Link href="/">
        <button
          style={{
            position: 'absolute',
            top: '25px',
            left: '5%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 600,
            zIndex: 11
          }}
        >
          ← Back
        </button>
      </Link>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '800px',
        width: '90%',
        padding: '20px',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        height: '70vh',
        zIndex: 1
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              padding: '15px 20px',
              borderRadius: '20px',
              maxWidth: '70%',
              wordWrap: 'break-word',
              background: msg.sender === 'user' ? 'linear-gradient(135deg,#ffffff 0%,#f0f0f0 100%)' : 'linear-gradient(135deg,rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.05) 100%)',
              color: msg.sender === 'user' ? '#000' : '#fff',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <strong>{msg.sender === 'user' ? 'You:' : 'FakeSpot AI:'}</strong> {msg.text}
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '20px',
          borderTop: '1px solid rgba(255,255,255,0.15)'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            placeholder="Enter your review text here..."
            style={{
              flex: 1,
              padding: '15px 20px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '25px',
              color: '#fff',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'text'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              padding: '15px 25px',
              background: loading ? '#cccccc' : '#fff',
              color: loading ? '#666' : '#000',
              border: 'none',
              borderRadius: '25px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Analyzing...' : 'Send'}
          </button>
        </div>
      </div>
    </main>
  );
}