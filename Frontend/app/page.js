'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Spline from '@splinetool/react-spline/next';

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const splineBgRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleAutoplayHelp = () => {
      if (video) video.play().catch(() => {});
      document.removeEventListener('scroll', handleAutoplayHelp);
      document.removeEventListener('click', handleAutoplayHelp);
    };
    document.addEventListener('scroll', handleAutoplayHelp);
    document.addEventListener('click', handleAutoplayHelp);

    let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    let scrollEndTimeout = null;
    let reverseAnimFrame = null;
    let lastFrameTime = 0;
    let reversing = false;

    const startReversing = () => {
      if (reversing) return;
      reversing = true;
      video.pause();
      lastFrameTime = performance.now();

      const updateReverse = (now) => {
        if (!reversing) return;
        const elapsed = now - lastFrameTime;

        if (elapsed >= 50) { // Limit to max 20fps seeking rate so the browser's video decoder doesn't lock up
          lastFrameTime = now;

          if (!video.seeking && !isNaN(video.duration)) {
            // Scrub backward by 1.5x time step
            let step = (elapsed / 1000) * 1.5;
            let newTime = video.currentTime - step;
            if (newTime <= 0) {
              newTime = video.duration || 0;
            }
            video.currentTime = newTime;
          }
        }
        reverseAnimFrame = requestAnimationFrame(updateReverse);
      };
      reverseAnimFrame = requestAnimationFrame(updateReverse);
    };

    const stopReversing = () => {
      if (!reversing) return;
      reversing = false;
      if (reverseAnimFrame) {
        cancelAnimationFrame(reverseAnimFrame);
        reverseAnimFrame = null;
      }
      video.play().catch(() => {});
    };

    const handleScrollPlayback = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const delta = scrollTop - lastScrollTop;
      
      if (delta < -2) {
        // Scroll Up significantly
        startReversing();
        clearTimeout(scrollEndTimeout);
        scrollEndTimeout = setTimeout(() => {
          stopReversing();
        }, 180); // Debounce to allow continuous scroll event sequence to hold reverse status
      } else if (delta > 2) {
        // Scroll Down significantly
        stopReversing();
      }
      
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    };

    window.addEventListener('scroll', handleScrollPlayback);
    return () => {
      window.removeEventListener('scroll', handleScrollPlayback);
      document.removeEventListener('scroll', handleAutoplayHelp);
      document.removeEventListener('click', handleAutoplayHelp);
      if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
      if (reverseAnimFrame) cancelAnimationFrame(reverseAnimFrame);
    };
  }, []);

  const enterSite = () => {
    setEntered(true);
  };

  const toggleContact = () => {
    setContactOpen(!contactOpen);
  };

  return (
    <main style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#000', overflowX: 'hidden' }}>
      
      {/* 1. WELCOME SCREEN */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        background: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        zIndex: 9999,
        transition: 'transform 1s cubic-bezier(0.85, 0, 0.15, 1), opacity 1s ease',
        transform: entered ? 'translateY(-100%)' : 'translateY(0)',
        opacity: entered ? 0 : 1,
        pointerEvents: entered ? 'none' : 'all'
      }}>
        <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}>
          <Spline scene="https://prod.spline.design/8HpdKLdA2VXvUEKK/scene.splinecode" />
        </div>
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', background: 'rgba(0,0,0,0.4)', padding: '40px', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ fontSize: '4rem', letterSpacing: '2px', fontWeight: 800, marginBottom: '15px' }}>Welcome to FakeSpot</h1>
          <p style={{ fontSize: '1.2rem', color: '#cccccc', fontWeight: 300, letterSpacing: '1px' }}>Detect Fake Reviews With AI</p>
          <button 
            onClick={enterSite}
            style={{
              marginTop: '40px',
              padding: '14px 50px',
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              fontFamily: 'inherit'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(255,255,255,0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Enter Platform
          </button>
        </div>
      </div>

      {/* 2. LIVE WALLPAPER VIDEO BACKGROUND */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      >
        <source src="/assets/neon-infinity.mp4" type="video/mp4" />
      </video>

      {/* 3. NAVBAR */}
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
          <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link>
          <Link href="/review" style={{ color: '#b3b3b3', textDecoration: 'none' }}>AI Chat Bot</Link>
          <Link href="/url-analyzer" style={{ color: '#b3b3b3', textDecoration: 'none' }}>URL Analyzer</Link>
        </div>
      </nav>

      {/* 4. MAIN LAYOUT (Only interactive when welcome screen is passed) */}
      <div style={{ opacity: entered ? 1 : 0, transition: 'opacity 1.5s ease', position: 'relative', zIndex: 1 }}>
        
        {/* HERO SECTION */}
        <header style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 20px',
          background: 'rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          {/* Subtle parallax background circles */}
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            top: '-100px',
            left: '-100px',
            transform: `translateY(${scrollY * 0.3}px)`
          }} />
          <div style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
            borderRadius: '50%',
            bottom: '50px',
            right: '-50px',
            transform: `translateY(${scrollY * 0.3}px)`
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: '4.2rem', marginBottom: '20px', fontWeight: 800, letterSpacing: '-1px' }}>
              Detect Fake Reviews With AI
            </h2>
            <p style={{ fontSize: '1.3rem', color: '#cccccc', marginBottom: '40px', fontWeight: 300 }}>
              Advanced machine learning powered detection system
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '30px' }}>
              <Link href="/review">
                <button 
                  className="neon-btn-cyan" 
                  style={{
                    padding: '16px 40px',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  AI Chat Bot
                </button>
              </Link>
              <Link href="/url-analyzer">
                <button 
                  className="neon-btn-pink" 
                  style={{
                    padding: '16px 40px',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  URL Analyzer
                </button>
              </Link>
            </div>
          </div>
        </header>

        {/* FEATURES SPLINE DISPLAY */}
        <section id="features" style={{ padding: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.6)' }}>
          <iframe 
            src="https://my.spline.design/theeternalarc-Y4d8m3ELoifgcUGtZc9VmmWK-cAx/" 
            style={{ width: '100%', height: '100%', border: 'none', transform: 'scale(1.2)', transformOrigin: 'center' }}
          />
        </section>

        {/* ABOUT SECTION */}
        <section id="about" style={{ padding: '120px 10%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <h2 style={{ fontSize: '3.5rem', marginBottom: '60px', background: 'linear-gradient(135deg, #ffffff 0%, #cccccc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center', fontWeight: 800, letterSpacing: '-1px' }}>
            About FakeSpot
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '2.2rem', marginBottom: '25px', color: '#ffffff', fontWeight: 700 }}>What We Do</h3>
              <p style={{ color: '#b3b3b3', lineHeight: 1.9, marginBottom: '20px', fontSize: '1.05rem' }}>
                FakeSpot is designed to identify whether online product reviews are fake or genuine using machine learning techniques. The system analyzes the text of customer reviews, processes them using natural language processing methods, and classifies them as fake or real.
              </p>
              <p style={{ color: '#b3b3b3', lineHeight: 1.9, marginBottom: '20px', fontSize: '1.05rem' }}>
                In addition to prediction, the system provides clear explanations for its decisions by highlighting important words or patterns that influenced the result. This transparency helps users understand exactly why a review was flagged as suspicious.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '40px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '5rem', marginBottom: '20px' }}>✨</div>
                <h3 style={{ color: '#ffffff', marginBottom: '15px', fontSize: '1.8rem' }}>Advanced Detection</h3>
                <p style={{ color: '#b3b3b3', fontSize: '1.05rem' }}>Our algorithm uses NLP and machine learning to understand patterns and detect sophisticated review fraud with explainable AI.</p>
              </div>
              <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', justifyContent: 'center', background: 'rgba(2,2,8,0.6)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                <div className="logo-item-cyber" style={{ padding: '15px 25px', borderRadius: '10px', textAlign: 'center', minWidth: '120px' }}>
                  <i className="fas fa-shopping-cart" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>Amazon</div>
                </div>
                <div className="logo-item-cyber" style={{ padding: '15px 25px', borderRadius: '10px', textAlign: 'center', minWidth: '120px' }}>
                  <i className="fas fa-bag-shopping" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>Flipkart</div>
                </div>
                <div className="logo-item-cyber" style={{ padding: '15px 25px', borderRadius: '10px', textAlign: 'center', minWidth: '120px' }}>
                  <i className="fas fa-store" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>E-Commerce</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" style={{ padding: '120px 10%', background: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <h2 style={{ fontSize: '3.5rem', marginBottom: '60px', background: 'linear-gradient(135deg, #ffffff 0%, #cccccc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center', fontWeight: 800, letterSpacing: '-1px' }}>
            Get In Touch
          </h2>
          <div style={{ maxWidth: '700px', margin: '0 auto 60px auto', textAlign: 'center' }}>
            <p style={{ color: '#b3b3b3', fontSize: '1.1rem', lineHeight: 1.9 }}>Have questions about our AI detection system? Want to integrate FakeSpot into your platform? We'd love to hear from you.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '30px' }}>
            <div className="cyber-card-pink" style={{ padding: '40px', borderRadius: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '20px' }}>📧</div>
              <h3 style={{ marginBottom: '12px', color: '#ffffff', fontWeight: 700, fontSize: '1.2rem' }}>Email</h3>
              <p style={{ color: '#b3b3b3', fontSize: '0.9rem', overflowWrap: 'break-word' }}>cu24250022@coeruniversity.ac.in</p>
              <p style={{ color: '#b3b3b3', fontSize: '0.9rem', overflowWrap: 'break-word' }}>cu240251579@coeruniversity.ac.in</p>
              <p style={{ color: '#b3b3b3', fontSize: '0.9rem', overflowWrap: 'break-word' }}>cu24250059@coeruniversity.ac.in</p>
            </div>
            <div className="cyber-card-pink" style={{ padding: '40px', borderRadius: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '20px' }}>📍</div>
              <h3 style={{ marginBottom: '12px', color: '#ffffff', fontWeight: 700, fontSize: '1.2rem' }}>Location</h3>
              <p style={{ color: '#b3b3b3', fontSize: '1rem' }}>India</p>
            </div>
            <div className="cyber-card-pink" style={{ padding: '40px', borderRadius: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '20px' }}>💼</div>
              <h3 style={{ marginBottom: '12px', color: '#ffffff', fontWeight: 700, fontSize: '1.2rem' }}>Business</h3>
              <p style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>cu24250022@coeruniversity.ac.in</p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid rgba(255,255,255,0.15)', color: '#64748b' }}>
          <p>&copy; 2026 FakeSpot - Fake Review Detector. All rights reserved.</p>
        </footer>
      </div>

      {/* 5. FLOATING CTA CONTACT BUTTON */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 99, animation: 'float-up 3s ease-in-out infinite' }}>
        <button 
          onClick={toggleContact}
          className="neon-btn-pink-round"
        >
          <i className="fas fa-envelope" style={{ fontSize: '1.1rem' }}></i>
          Contact Us
        </button>
      </div>

      {/* 6. CONTACT POPUP MODAL */}
      <div style={{
        display: contactOpen ? 'block' : 'none',
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10000,
        background: 'rgba(0,0,0,0.95)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '20px',
        padding: '40px',
        backdropFilter: 'blur(20px)',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(255,255,255,0.1)',
        animation: 'fadeIn 0.3s ease'
      }}>
        <button 
          onClick={toggleContact}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
        >
          &times;
        </button>
        <h3 style={{ color: '#ffffff', marginBottom: '30px', fontSize: '1.8rem' }}>Get In Touch</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '20px', borderRadius: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <i className="fas fa-envelope" style={{ fontSize: '1.3rem', color: '#ffffff' }}></i>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>Email</span>
            </div>
            <a href="mailto:cu24250022@coeruniversity.ac.in,cu240251579@coeruniversity.ac.in,cu24250059@coeruniversity.ac.in" style={{ color: '#b3b3b3', textDecoration: 'none', fontSize: '0.85rem', display: 'block', wordBreak: 'break-all' }}>
              cu24250022@coeruniversity.ac.in, cu240251579@coeruniversity.ac.in
            </a>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '20px', borderRadius: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <i className="fas fa-briefcase" style={{ fontSize: '1.3rem', color: '#ffffff' }}></i>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>Business</span>
            </div>
            <a href="mailto:cu24250022@coeruniversity.ac.in" style={{ color: '#b3b3b3', textDecoration: 'none', fontSize: '0.85rem' }}>
              cu24250022@coeruniversity.ac.in
            </a>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float-up {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translate(-50%, -55%); }
          100% { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </main>
  );
}