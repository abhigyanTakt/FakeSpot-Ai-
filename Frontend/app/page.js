'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false });

export default function Home() {
  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh' }}>
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
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        zIndex: 1
      }}>
        <h2 style={{
          fontSize: '4rem',
          marginBottom: '20px',
          fontWeight: 800,
          letterSpacing: '-1px'
        }}>
          Detect Fake Reviews With AI
        </h2>
        <p style={{
          fontSize: '1.3rem',
          color: '#cccccc',
          marginBottom: '40px',
          fontWeight: 300
        }}>
          Advanced machine learning powered detection system
        </p>
        <Link href="/review">
          <button style={{
            padding: '16px 60px',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1.1rem'
          }}>
            Get Started
          </button>
        </Link>
      </div>
    </main>
  );
}