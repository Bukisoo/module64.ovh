// ProvisionBle.jsx — nicer UI (no framework)
// deps: npm i esp-idf-provisioning-web

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

  const statusText = provDev ? (busy ? "Connected • working" : "Connected") : busy ? "Working…" : "Not connected";
  const dotClass = provDev ? (busy ? "m64-dot m64-dot--busy" : "m64-dot m64-dot--good") : "m64-dot";

  async function connectAndScan() {
    setErr("");
    setBusy(true);
    try {
      pushLog("Opening BLE device picker…");
      const dev = await ESPProvisionManager.searchBLEDevice();
      setProvDev(dev);

      pushLog(`Selected: ${dev?.deviceName || dev?.name || "(no name)"}`);
      pushLog("Connecting (Security0)…");
      await dev.connect();

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
    <div className="m64-page">
      <div className="m64-shell">
        <div className="m64-card">
          <div className="m64-card__top">
            <div className="m64-title">
              <h1>Module64 — BLE Provisioning</h1>
              <p className="m64-sub">Security0 • scan SSIDs after connect • Chrome/Edge only</p>
            </div>

            <div className="m64-pill" title="Connection status">
              <span className={dotClass} />
              <span>{statusText}</span>
            </div>
          </div>

          <div className="m64-glow" />

          <div className="m64-card__body">
            <div className="m64-row">
              <button
                className="m64-btn m64-btn--primary"
                onClick={connectAndScan}
                disabled={busy || !!provDev}
              >
                {provDev ? "Connected" : busy ? "Connecting…" : "Connect + Scan SSIDs"}
              </button>

              <button
                className="m64-btn m64-btn--ghost"
                onClick={provision}
                disabled={busy || !provDev || !ssid}
              >
                Send credentials
              </button>
            </div>

            <div className="m64-grid">
              <div className="m64-field">
                <div className="m64-label">Wi-Fi network</div>
                <select
                  className="m64-select"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  disabled={busy || !provDev}
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
                <div className="m64-help">
                  Tip: choose the strongest RSSI entry (top of the list).
                </div>
              </div>

              <div className="m64-field">
                <div className="m64-label">Password</div>
                <input
                  className="m64-input"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="Wi-Fi password"
                  disabled={busy || !provDev}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {err ? <div className="m64-alert">{err}</div> : null}

            <div className="m64-log">
              <div className="m64-log__top">
                <div className="m64-log__title">Log</div>
                <div className="m64-log__meta">{log.length ? `${Math.min(40, log.length)} / ${log.length}` : "—"}</div>
              </div>
              <pre className="m64-pre">{log.slice(-40).join("\n")}</pre>
            </div>

            <div className="m64-footer">
              Web Bluetooth requires a secure context: HTTPS (or http://localhost). Chrome/Edge only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}