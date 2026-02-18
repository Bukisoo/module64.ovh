import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ProvisionBle from "./ProvisionBle";
import "./index.css";

const SectionHeader = ({ num, title }) => (
  <div style={{ marginBottom: '2rem' }}>
    <span style={{ color: 'var(--accent)' }}>[{num}]</span>
    <h2>{title}</h2>
  </div>
);

function Home() {
  return (
    <div className="home-root">
      <div className="pixel-grid" />
      
      {/* HERO SECTION */}
      <section className="container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '5rem', lineHeight: 0.9 }}>MODULE<br/>64</h1>
          <p style={{ margin: '2rem 0', maxWidth: '400px' }}>
            A 240fps physical visualization engine. HUB75 hardware powered by an ESP32 agent. 
            Zero latency. Total transparency.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/buy" className="btn">Order SKU-01</Link>
            <Link to="/provisioning" className="dim" style={{ alignSelf: 'center' }}>Setup Device →</Link>
          </div>
        </div>
        
        {/* Placeholder for the "Wallpaper Engine" Visual */}
        <div className="card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ animation: 'pulse 2s infinite' }}>
            [VIDEO: 240FPS VIZ AGENT PREVIEW]<br/>
            <span className="dim" style={{ fontSize: '0.8rem' }}>Reactive Audio / LAN Stream</span>
          </div>
        </div>
      </section>

      {/* PRESENTATION / SPECS */}
      <section className="container">
        <SectionHeader num="01" title="The Architecture" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1px', background: 'var(--border)' }}>
          {[
            { t: 'LAN Controlled', d: 'mDNS discovery. No cloud. No latency.' },
            { t: '240 FPS', d: 'Native C++ driver optimized for HUB75 refresh.' },
            { t: 'BLE Prov', d: 'Setup WiFi via Bluetooth in seconds.' },
            { t: 'Open API', d: 'Stream mathematical viz or PC inputs.' }
          ].map((spec, i) => (
            <div key={i} className="card" style={{ background: 'var(--bg)' }}>
              <h3>{spec.t}</h3>
              <p className="dim">{spec.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TECH / POWERUSER SPOT */}
      <section style={{ background: '#000' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <SectionHeader num="02" title="Power Users" />
            <p className="dim">Download binaries, access the viz repo, or contribute to the agent software.</p>
          </div>
          <div className="card" style={{ borderColor: 'var(--accent)' }}>
            <code style={{ color: 'var(--accent)' }}>$ curl -sSL module64.local/install | sh</code>
            <div style={{ marginTop: '2rem' }}>
              <a href="#" style={{ color: 'white', display: 'block' }}>→ GitHub Repository</a>
              <a href="#" style={{ color: 'white', display: 'block' }}>→ v1.0.4-stable.bin</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container" style={{ maxWidth: '800px' }}>
        <SectionHeader num="03" title="FAQ" />
        <details style={{ padding: '1rem 0', borderBottom: '1px solid #222' }}>
          <summary style={{ cursor: 'pointer' }}>Is it compatible with Wallpaper Engine?</summary>
          <p className="dim" style={{ padding: '1rem' }}>It acts as a standalone physical wallpaper. Our agent bridges PC inputs to the display.</p>
        </details>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/provisioning" element={<ProvisionBle />} />
      </Routes>
    </BrowserRouter>
  );
}