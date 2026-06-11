'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Spline from '@splinetool/react-spline/next';

export default function Review() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 👋 I'm your AI review detective! I can analyze both text reviews and images to help you spot fake reviews. Just paste a review, upload an image, or say hi - I'm here to help! 😊",
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Analyzing...');
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const chatMessagesEndRef = useRef(null);
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

  // Parallax cursor tracking for robot background
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

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        setSelectedFile(null); // Clear file upload
        // Append preview image in user message
        const newMsg = {
          id: Date.now(),
          text: '',
          image: event.target.result,
          sender: 'user'
        };
        setMessages((prev) => [...prev, newMsg]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setSelectedImage(null); // Clear image upload
      const newMsg = {
        id: Date.now(),
        text: `File attached: ${file.name}`,
        sender: 'user',
        isFile: true
      };
      setMessages((prev) => [...prev, newMsg]);
    }
  };

  const sendMessage = async () => {
    const textToAnalyze = input.trim();
    const imageToAnalyze = selectedImage;
    const fileToAnalyze = selectedFile;

    if (!textToAnalyze && !imageToAnalyze && !fileToAnalyze) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Hi! I'm here to help you analyze reviews. You can paste review text, upload an image/file, or just say hello! 😊",
          sender: 'bot'
        }
      ]);
      return;
    }

    // Reset input fields
    setInput('');
    setSelectedImage(null);
    setSelectedFile(null);

    // Show user message if they typed something
    if (textToAnalyze) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: textToAnalyze, sender: 'user' }
      ]);
    }

    setLoading(true);

    const typingMsgs = [
      'Analyzing your message... 🔍',
      'Processing with AI... 🤖',
      'Checking for authenticity... ✅',
      'Examining patterns... 📊'
    ];
    setLoadingMsg(typingMsgs[Math.floor(Math.random() * typingMsgs.length)]);

    try {
      const API_BASE_URL = getApiUrl();

      if (textToAnalyze) {
        const response = await fetch(`${API_BASE_URL}/analyze-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToAnalyze })
        });
        
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        
        const data = await response.json();
        
        if (data.error) {
          addBotMessage(`Error: ${data.error}`, 'fake-result');
        } else {
          if (data.intent === 'greeting' || data.intent === 'casual' || data.intent === 'capabilities') {
            addBotMessage(data.result);
          } else {
            const statusClass = data.analysis && data.analysis.is_fake ? 'fake-result' : 'genuine-result';
            addBotMessage(data.result, statusClass);
          }
        }
      } 
      
      else if (imageToAnalyze) {
        const res = await fetch(imageToAnalyze);
        const blob = await res.blob();
        const formData = new FormData();
        formData.append('image', blob, 'image.jpg');

        const response = await fetch(`${API_BASE_URL}/analyze-image`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        
        const data = await response.json();
        
        if (data.error) {
          addBotMessage(`Error: ${data.error}`, 'fake-result');
        } else {
          const statusClass = data.analysis && data.analysis.is_fake ? 'fake-result' : 'genuine-result';
          addBotMessage(data.result, statusClass);
        }
      } 
      
      else if (fileToAnalyze) {
        const formData = new FormData();
        formData.append('file', fileToAnalyze);

        const response = await fetch(`${API_BASE_URL}/analyze-bulk`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        
        const data = await response.json();

        if (data.error) {
          addBotMessage(`Error: ${data.error}`, 'fake-result');
        } else {
          let report = `<strong>Bulk Analysis Complete!</strong><br/>`;
          report += `Total Reviews Found: ${data.total_found}<br/>`;
          report += `Overall Authenticity Percentage: <strong>${data.accuracy_percentage.toFixed(1)}%</strong><br/><br/>`;
          report += `<em>Top Findings:</em><br/>`;
          
          let fakeCount = 0;
          data.results.forEach((res) => {
            const isFake = res.analysis.is_fake;
            if (isFake) fakeCount++;
            const status = isFake 
              ? '<span style="color:#ff6b6b">❌ Fake</span>' 
              : '<span style="color:#51cf66">✅ Genuine</span>';
            report += `• "${res.review}" - <strong>${status}</strong> (${res.analysis.authenticity_score}%)<br/>`;
          });

          const overallStatusClass = (fakeCount > data.results.length / 2) ? 'fake-result' : 'genuine-result';
          addBotMessage(report, overallStatusClass);
        }
      }

    } catch (err) {
      console.error(err);
      addBotMessage('Error connecting to AI service. Please make sure your backend is online.', 'fake-result');
    } finally {
      setLoading(false);
    }
  };

  const addBotMessage = (text, statusClass = '') => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        text: text,
        sender: 'bot',
        statusClass: statusClass
      }
    ]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      sendMessage();
    }
  };

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', background: 'transparent', overflow: 'hidden' }}>
      
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
          <Link href="/review" style={{ color: '#fff', textDecoration: 'none' }}>AI Chat Bot</Link>
          <Link href="/url-analyzer" style={{ color: '#b3b3b3', textDecoration: 'none' }}>URL Analyzer</Link>
        </div>
      </nav>

      {/* CHAT CONTAINER */}
      <div style={{
        position: 'absolute',
        top: '55%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '1000px',
        width: '90%',
        padding: '20px',
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        height: '70vh',
        zIndex: 1,
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)'
      }}>
        
        {/* MESSAGES VIEW */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message-bubble ${msg.sender} ${msg.statusClass || ''}`}
              style={{
                padding: '15px 20px',
                borderRadius: '20px',
                maxWidth: '70%',
                wordWrap: 'break-word',
                fontSize: '1.05rem',
                fontWeight: 500,
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'user'
                  ? 'linear-gradient(135deg, #d0d0d0 0%, #b0b0b0 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.2) 100%)',
                color: msg.sender === 'user' ? '#000' : '#fff',
                border: msg.statusClass === 'fake-result'
                  ? '1px solid rgba(255, 107, 107, 0.4)'
                  : msg.statusClass === 'genuine-result'
                    ? '1px solid rgba(81, 207, 102, 0.4)'
                    : 'none',
                boxShadow: msg.statusClass === 'fake-result'
                  ? '0 0 10px rgba(255, 107, 107, 0.2)'
                  : msg.statusClass === 'genuine-result'
                    ? '0 0 10px rgba(81, 207, 102, 0.2)'
                    : 'none'
              }}
            >
              <strong>{msg.sender === 'user' ? 'You:' : 'FakeSpot AI:'} </strong>
              
              {msg.image ? (
                <img 
                  src={msg.image} 
                  alt="Review Screenshot" 
                  style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '10px', marginTop: '5px' }} 
                />
              ) : (
                <span dangerouslySetInnerHTML={{ __html: msg.text }} />
              )}
            </div>
          ))}

          {loading && (
            <div style={{
              padding: '15px 20px',
              borderRadius: '20px',
              maxWidth: '70%',
              alignSelf: 'flex-start',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
              color: '#fff',
              fontSize: '1.05rem',
              fontWeight: 500
            }}>
              <strong>FakeSpot AI: </strong> {loadingMsg} <span className="typing-dots">...</span>
            </div>
          )}
          
          <div ref={chatMessagesEndRef} />
        </div>

        {/* INPUT FORM BLOCK */}
        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '20px 10px 10px 10px',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          alignItems: 'center'
        }}>
          {/* 1. Image Upload Icon Button */}
          <label 
            title="Upload Image"
            style={{
              cursor: 'pointer',
              fontSize: '1.2rem',
              color: '#fff',
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '25px',
              border: '1px solid rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <i className="fas fa-image"></i>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              style={{ display: 'none' }} 
            />
          </label>

          {/* 2. File Bulk Upload Icon Button */}
          <label 
            title="Upload PDF/Excel/CSV"
            style={{
              cursor: 'pointer',
              fontSize: '1.2rem',
              color: '#fff',
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '25px',
              border: '1px solid rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <i className="fas fa-file-upload"></i>
            <input 
              type="file" 
              accept=".pdf,.xlsx,.xls,.csv" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </label>

          {/* 3. Text Message Input Box */}
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            placeholder={
              selectedImage 
                ? "Send image file..." 
                : selectedFile 
                  ? "Send bulk review document..." 
                  : "Enter your review text here..."
            }
            style={{
              flex: 1,
              padding: '15px 20px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '25px',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 500,
              outline: 'none'
            }}
          />

          {/* 4. Action Button */}
          <button 
            onClick={sendMessage}
            disabled={loading}
            style={{
              padding: '15px 25px',
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Send
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
        .typing-dots {
          animation: typing 1.5s infinite;
        }
      `}</style>
    </main>
  );
}