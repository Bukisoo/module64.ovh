import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ESPProvisionManager } from "esp-idf-provisioning-web";

export default function ProvisionBle() {
  const [provDev, setProvDev] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [wifiList, setWifiList] = useState([]);
  const [ssid, setSsid] = useState("");
  const [pass, setPass] = useState("");
  const [log, setLog] = useState([]);
  
  const logEndRef = useRef(null);

  // Auto-scroll the log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const pushLog = (s) =>
    setLog((l) => [...l, `> ${new Date().toLocaleTimeString([], { hour12: false })} | ${s}`]);

  const uiError = (e) => {
    const msg = e?.message || String(e);
    setErr(msg);
    pushLog(`CRITICAL_ERR: ${msg}`);
  };

  const sortedWifi = useMemo(() => {
    const arr = (wifiList || []).map((x) => ({
      ssid: x?.ssid ?? x?.name ?? "",
      rssi: typeof x?.rssi === "number" ? x.rssi : null,
      auth: x?.auth ?? x?.security ?? null,
    }));
    const best = new Map();
    for (const ap of arr) {
      if (!ap.ssid) continue;
      const cur = best.get(ap.ssid);
      if (!cur || (ap.rssi ?? -999) > (cur.rssi ?? -999)) best.set(ap.ssid, ap);
    }
    return Array.from(best.values()).sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999));
  }, [wifiList]);

  async function connectAndScan() {
    setErr("");
    setBusy(true);
    try {
      pushLog("SEARCHING_FOR_BLE_DEVICE...");
      const dev = await ESPProvisionManager.searchBLEDevice();
      setProvDev(dev);
      pushLog(`HANDSHAKE_SUCCESS: ${dev?.deviceName || "MODULE64"}`);
      await dev.connect();
      pushLog("LINK_ESTABLISHED.");
      const list = await dev.scanWifiList();
      setWifiList(Array.isArray(list) ? list : []);
      pushLog(`WIFI_SCAN_COMPLETE: Found ${list?.length || 0} APs.`);
    } catch (e) {
      uiError(e);
      setProvDev(null);
    } finally {
      setBusy(false);
    }
  }

  async function provision() {
    setErr("");
    if (!provDev) return setErr("No active link.");
    if (!ssid) return setErr("Target SSID missing.");
    setBusy(true);
    try {
      pushLog(`SENDING_PROVISIONING_DATA: SSID[${ssid}]`);
      await provDev.provision(ssid, pass || "");
      pushLog("PROVISIONING_SENT: Device is rebooting.");
    } catch (e) {
      uiError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div className="pixel-grid" />
      
      <div className="card" style={{ width: "100%", maxWidth: "600px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h2 style={{ margin: 0 }}>[ DEVICE_PROVISION ]</h2>
            <p className="dim" style={{ fontSize: "0.7rem", marginTop: "4px" }}>MODULE64_ESP32_PROVISION_SERVICE_V1</p>
          </div>
          <Link to="/" className="dim" style={{ textDecoration: "none", fontSize: "0.8rem", border: "1px solid #ddd", padding: "4px 8px" }}>EXIT</Link>
        </div>

        {/* STATUS BAR */}
        <div style={{ 
          background: provDev ? "var(--accent-soft)" : "#f4f4f418", 
          padding: "1rem", 
          borderLeft: `4px solid ${provDev ? "var(--accent)" : "#999"}`,
          marginBottom: "2rem",
          fontSize: "0.8rem"
        }}>
          <strong>CONNECTION_STATUS:</strong> {provDev ? "ACTIVE" : busy ? "SCANNING..." : "DISCONNECTED"}
          {err && <div style={{ color: "red", marginTop: "8px", fontWeight: "bold" }}>!! {err}</div>}
        </div>

        {/* STEP 1: SCAN */}
        {!provDev && (
          <div style={{ marginBottom: "2rem" }}>
            <button className="btn" onClick={connectAndScan} disabled={busy} style={{ width: "100%" }}>
              {busy ? "COMMUNICATING..." : "INITIATE BLE SCAN"}
            </button>
          </div>
        )}

        {/* STEP 2: FORM */}
        {provDev && (
          <div style={{ display: "grid", gap: "1.5rem", marginBottom: "2rem" }}>
            <div className="field">
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "8px" }}>SELECT_SSID</label>
              <select
                style={{ width: "100%", padding: "12px", border: "var(--border)", background: "white", fontFamily: "var(--font-mono)" }}
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                disabled={busy}
              >
                <option value="">-- SELECT NETWORK --</option>
                {sortedWifi.map((ap) => (
                  <option key={ap.ssid} value={ap.ssid}>
                    {ap.ssid} {ap.rssi != null ? `[${ap.rssi}dBm]` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "8px" }}>NETWORK_KEY</label>
              <input
                type="password"
                style={{ width: "100%", padding: "12px", border: "var(--border)", fontFamily: "var(--font-mono)" }}
                placeholder="Enter WPA2/3 key"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                disabled={busy}
              />
            </div>

            <button className="btn" onClick={provision} disabled={!ssid || busy} style={{ width: "100%" }}>
              {busy ? "UPLOADING..." : "TRANSMIT CREDENTIALS"}
            </button>
          </div>
        )}

        {/* LOG CONSOLE */}
        <div style={{ 
          background: "#1a1a1a", 
          color: "#00ff00", 
          padding: "1rem", 
          fontFamily: "var(--font-mono)", 
          fontSize: "0.7rem",
          height: "150px",
          overflowY: "auto",
          border: "4px solid #333"
        }}>
          {log.map((line, i) => <div key={i}>{line}</div>)}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}