'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Spline from '@splinetool/react-spline/next';

export default function UrlAnalyzer() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Scraping page content & analyzing reviews...');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const splineBgRef = useRef(null);

  // Dynamic API base URL switching
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return (hostname === 'localhost' || hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : 'https://fakespot-ai.onrender.com';
    }
    return 'https://fakespot-ai.onrender.com';
  };

  // Parallax cursor tracking for background
  useEffect(() => {
    const handleMouseMove = (e) => {
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      const mouseY = (e.clientY / window.innerHeight) * 2 - 1;
      if (splineBgRef.current) {
        const rotateX = mouseY * 5;
        const rotateY = mouseX * 5;
        splineBgRef.current.style.transform = `scale(1.5) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const startUrlAnalysis = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL to analyze.');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('The URL must start with http:// or https://');
      return;
    }

    // Reset states
    setError('');
    setResult(null);
    setLoading(true);

    // Dynamic loading status rotation
    const messages = [
      "Connecting to e-commerce source... 🌐",
      "Scraping review contents... 🕷️",
      "Feeding reviews into NLP model... 🧠",
      "Checking language consistency... 🔍",
      "Generating final safety verdict... 🤖"
    ];
    let msgIndex = 0;
    setLoadingMsg(messages[0]);
    
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingMsg(messages[msgIndex]);
    }, 2500);

    try {
      const API_BASE_URL = getApiUrl();
      const response = await fetch(`${API_BASE_URL}/analyze-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error occurred during URL parsing.');
      }

      const data = await response.json();
      setResult(data.analysis || {
        is_fake: false,
        authenticity_score: 50,
        reasoning: data.result || 'No reasoning details returned.'
      });

    } catch (err) {
      console.error(err);
      setError(err.message || 'Error connecting to API. Please make sure the backend is running.');
    } finally {
      clearInterval(msgInterval);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      startUrlAnalysis();
    }
  };

  // Circular progress calculations
  const circumference = 377; // 2 * PI * r (r=60)
  const score = result?.authenticity_score !== undefined ? result.authenticity_score : 0;
  const isFake = result?.is_fake !== undefined ? result.is_fake : false;
  const offset = circumference - (score / 100) * circumference;

  return (
    <main style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#000', overflowX: 'hidden' }}>
      
      {/* 3D BACKGROUND */}
      <div 
        ref={splineBgRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          transform: 'scale(1.5)',
          transformOrigin: 'center',
          transition: 'transform 0.1s ease-out'
        }}
      >
        <Spline scene="https://my.spline.design/nexbotrobotcharacterconcept-EYYDbSvQRzK70oIdK0a6pvcz/" />
      </div>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        padding: '25px 5%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        fontWeight: 600,
        fontSize: '1.1rem'
      }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.3rem', fontWeight: 800 }}>
          FakeSpot
        </Link>
        <div style={{ display: 'flex', gap: '30px', listStyle: 'none' }}>
          <Link href="/" style={{ color: '#b3b3b3', textDecoration: 'none' }}>Home</Link>
          <Link href="/review" style={{ color: '#b3b3b3', textDecoration: 'none' }}>AI Chat Bot</Link>
          <Link href="/url-analyzer" style={{ color: '#fff', textDecoration: 'none' }}>URL Analyzer</Link>
        </div>
      </nav>

      {/* CONTAINER */}
      <div style={{
        position: 'relative',
        maxWidth: '850px',
        width: '90%',
        margin: '160px auto 50px auto',
        padding: '40px',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(25px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '24px',
        zIndex: 1,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            letterSpacing: '-0.5px',
            marginBottom: '10px',
            background: 'linear-gradient(135deg, #ffffff 0%, #a5a5a5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Product URL Analyzer
          </h2>
          <p style={{ color: '#b3b3b3', fontSize: '1.1rem', fontWeight: 300 }}>
            Scan e-commerce product pages directly to determine the legitimacy of reviews.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '12px',
            padding: '15px 20px',
            color: '#ff6b6b',
            marginBottom: '25px',
            fontWeight: 500,
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            placeholder="Paste Amazon, Flipkart, or e-commerce URL here..." 
            style={{
              flex: 1,
              minWidth: '280px',
              padding: '18px 24px',
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              color: '#fff',
              fontSize: '1.1rem',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
          />
          <button 
            onClick={startUrlAnalysis}
            disabled={loading}
            style={{
              padding: '18px 36px',
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '1.1rem',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <i className="fas fa-search"></i> Analyze
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            {/* Spinning Loader */}
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              borderTopColor: '#fff',
              animation: 'spin 1s ease-in-out infinite',
              margin: '0 auto 20px auto'
            }} />
            <div style={{ fontSize: '1.1rem', color: '#b3b3b3', animation: 'pulse 1.5s infinite' }}>
              {loadingMsg}
            </div>
          </div>
        )}

        {result && (
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: '35px',
            animation: 'fadeIn 0.5s ease forwards'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', alignItems: 'start' }}>
              
              {/* Score Box */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                padding: '30px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ position: 'relative', width: '140px', height: '140px', marginBottom: '20px' }}>
                  <svg style={{ transform: 'rotate(-90deg)', width: '140px', height: '140px' }}>
                    <circle cx="70" cy="70" r="60" style={{ fill: 'none', stroke: 'rgba(255,255,255,0.08)', strokeWidth: '10' }} />
                    <circle 
                      cx="70" 
                      cy="70" 
                      r="60" 
                      style={{
                        fill: 'none',
                        stroke: isFake ? '#ff6b6b' : '#51cf66',
                        strokeWidth: '10',
                        strokeLinecap: 'round',
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        transition: 'stroke-dashoffset 0.8s ease-in-out'
                      }} 
                    />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: isFake ? '#ff6b6b' : '#51cf66'
                  }}>
                    {score}%
                  </div>
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 18px',
                  borderRadius: '30px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  background: isFake ? 'rgba(255, 107, 107, 0.15)' : 'rgba(81, 207, 102, 0.15)',
                  color: isFake ? '#ff6b6b' : '#51cf66',
                  border: isFake ? '1px solid rgba(255, 107, 107, 0.3)' : '1px solid rgba(81, 207, 102, 0.3)',
                  boxShadow: isFake ? '0 0 15px rgba(255, 107, 107, 0.15)' : '0 0 15px rgba(81, 207, 102, 0.15)'
                }}>
                  {isFake ? 'Suspected Fake' : 'Verified Genuine'}
                </div>
              </div>

              {/* Reasoning Details */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                padding: '30px'
              }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
                  Authenticity Report
                </h3>
                <div style={{ lineHeight: 1.8, color: '#e0e0e0', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
                  {result.reasoning}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
