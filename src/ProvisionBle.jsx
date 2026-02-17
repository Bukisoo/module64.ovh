// ProvisionBle.jsx — barebones ESP-IDF BLE provisioning via esp-idf-provisioning-web
// - Security0 only (no PoP, ever)
// - Scan SSIDs immediately after connect
// - No disconnect button
//
// deps: npm i esp-idf-provisioning-web
// Notes: Chromium only, HTTPS or http://localhost required.

import React, { useMemo, useState } from "react";
import { ESPProvisionManager } from "esp-idf-provisioning-web";

export default function ProvisionBle() {
  const [provDev, setProvDev] = useState(null);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [wifiList, setWifiList] = useState([]);
  const [ssid, setSsid] = useState("");
  const [pass, setPass] = useState("");

  const [log, setLog] = useState([]);
  const pushLog = (s) => setLog((l) => [...l, `[${new Date().toLocaleTimeString()}] ${s}`]);

  const uiError = (e) => {
    const msg = e?.message || String(e);
    setErr(msg);
    pushLog(`ERROR: ${msg}`);
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
      if (!cur) best.set(ap.ssid, ap);
      else {
        const a = cur.rssi ?? -999;
        const b = ap.rssi ?? -999;
        if (b > a) best.set(ap.ssid, ap);
      }
    }
    return Array.from(best.values()).sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999));
  }, [wifiList]);

  async function connectAndScan() {
    setErr("");
    setBusy(true);
    try {
      pushLog("Opening BLE device picker…");
      const dev = await ESPProvisionManager.searchBLEDevice(); // native picker
      setProvDev(dev);

      pushLog(`Selected: ${dev?.deviceName || dev?.name || "(no name)"}`);
      pushLog("Connecting (Security0)…");
      await dev.connect(); // no PoP

      pushLog("Connected ✅");
      pushLog("Scanning Wi-Fi networks…");
      const list = await dev.scanWifiList();
      setWifiList(Array.isArray(list) ? list : []);
      pushLog(`Found ${Array.isArray(list) ? list.length : 0} AP(s).`);
    } catch (e) {
      uiError(e);
      setProvDev(null);
      setWifiList([]);
      setSsid("");
      setPass("");
    } finally {
      setBusy(false);
    }
  }

  async function provision() {
    setErr("");
    if (!provDev) return setErr("Not connected.");
    if (!ssid) return setErr("Pick an SSID first.");
    setBusy(true);
    try {
      pushLog(`Sending creds → SSID="${ssid}" (passLen=${(pass || "").length})…`);
      await provDev.provision(ssid, pass || "");
      pushLog("Provision command sent ✅ (ESP should join Wi-Fi now)");
    } catch (e) {
      uiError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, fontFamily: "system-ui, sans-serif" }}>
      <h3>Module64 — BLE Provisioning (Security0)</h3>

      <div style={{ display: "grid", gap: 10 }}>
        <button onClick={connectAndScan} disabled={busy || !!provDev} style={{ padding: "10px 12px", fontWeight: 600 }}>
          {provDev ? "Connected" : busy ? "Connecting…" : "Connect + Scan SSIDs"}
        </button>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, opacity: 0.8 }}>Wi-Fi network</label>
          <select
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
            disabled={busy || !provDev}
            style={{ padding: 8 }}
          >
            <option value="">— pick SSID —</option>
            {sortedWifi.map((ap) => (
              <option key={ap.ssid} value={ap.ssid}>
                {ap.ssid}
                {ap.rssi != null ? `  (${ap.rssi} dBm)` : ""}
                {ap.auth ? `  [${ap.auth}]` : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 13, opacity: 0.8 }}>Password</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Wi-Fi password"
            disabled={busy || !provDev}
            style={{ padding: 8 }}
          />
        </div>

        <button
          onClick={provision}
          disabled={busy || !provDev || !ssid}
          style={{ padding: "10px 12px", fontWeight: 600 }}
        >
          Send credentials
        </button>

        {err ? (
          <div style={{ padding: 10, background: "#ffecec", border: "1px solid #ffb3b3" }}>
            {err}
          </div>
        ) : null}

        <div style={{ padding: 10, background: "#f6f6f6", border: "1px solid #ddd" }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Log</div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>
            {log.slice(-40).join("\n")}
          </pre>
        </div>

        <div style={{ fontSize: 12, opacity: 0.75 }}>
          Web BLE: Chrome/Edge only, served over HTTPS (or localhost).
        </div>
      </div>
    </div>
  );
}