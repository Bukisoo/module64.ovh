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
  const pushLog = (s) =>
    setLog((l) => [...l, `[${new Date().toLocaleTimeString()}] ${s}`]);

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

    return Array.from(best.values()).sort(
      (a, b) => (b.rssi ?? -999) - (a.rssi ?? -999)
    );
  }, [wifiList]);

  async function connectAndScan() {
    setErr("");
    setBusy(true);
    try {
      pushLog("Opening BLE picker…");
      const dev = await ESPProvisionManager.searchBLEDevice();
      setProvDev(dev);

      pushLog(`Selected: ${dev?.deviceName || dev?.name || "device"}`);
      await dev.connect();

      pushLog("Connected.");
      const list = await dev.scanWifiList();
      setWifiList(Array.isArray(list) ? list : []);
      pushLog(`Found ${list?.length || 0} networks.`);
    } catch (e) {
      uiError(e);
      setProvDev(null);
    } finally {
      setBusy(false);
    }
  }

  async function provision() {
    setErr("");
    if (!provDev) return setErr("Not connected.");
    if (!ssid) return setErr("Select a network first.");

    setBusy(true);
    try {
      await provDev.provision(ssid, pass || "");
      pushLog("Credentials sent.");
    } catch (e) {
      uiError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Module64 BLE Provisioning</h1>
        <div className="subtitle">
          Chrome/Edge only — HTTPS or localhost required
        </div>

        <div className="status">
          Status: {provDev ? "Connected" : busy ? "Working…" : "Not connected"}
        </div>

        <button
          onClick={connectAndScan}
          disabled={busy || !!provDev}
          style={{ marginBottom: 16 }}
        >
          {provDev ? "Connected" : "Connect + Scan Wi-Fi"}
        </button>

        <div className="field">
          <label>Wi-Fi network</label>
          <select
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
            disabled={!provDev || busy}
          >
            <option value="">Select network</option>
            {sortedWifi.map((ap) => (
              <option key={ap.ssid} value={ap.ssid}>
                {ap.ssid}
                {ap.rssi != null ? ` (${ap.rssi} dBm)` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Wi-Fi password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            disabled={!provDev || busy}
          />
        </div>

        <button
          onClick={provision}
          disabled={!ssid || !provDev || busy}
          style={{ marginBottom: 16 }}
        >
          Send credentials
        </button>

        {err && <div className="error">{err}</div>}

        <div className="log">{log.slice(-40).join("\n")}</div>
      </div>
    </div>
  );
}