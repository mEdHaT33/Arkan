import React, { useEffect, useMemo, useState } from "react";

/* =========================
   API base
   ========================= */
const API_BASE = "https://arkanaltafawuq.com/arkan-system";
const api = {
  parties: `${API_BASE}/get_clients.php`,
  receipts: `${API_BASE}/party_receipts.php`,
};

const fmt = (n) =>
  (Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function AllReceiptsPage() {
  /* ------------ state ------------ */
  const [partyType, setPartyType] = useState("client"); // client | vendor
  const [direction, setDirection] = useState("in");     // in | out
  const [account, setAccount] = useState("bank");       // bank | cash
  const [txnDate, setTxnDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [partyId, setPartyId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const [allParties, setAllParties] = useState([]);
  const [receipts, setReceipts] = useState([]);

  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [limit, setLimit] = useState(50);
  const [refreshTick, setRefreshTick] = useState(0);

  // Grouping controls
  const [groupByParty, setGroupByParty] = useState(false);
  const [groupPartyId, setGroupPartyId] = useState("");
  const [expandedPartyKey, setExpandedPartyKey] = useState(""); // `${type}:${id}` to show receipts

  const loggedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("username"));
    } catch {
      return {error: "No logged user"};
    }
  })();

  /* ------------ load parties (uses your working endpoint) ------------ */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingParties(true);
      setError("");
      try {
        const res = await fetch(api.parties);
        const j = await res.json();
        const clean = (j.clients || [])
          .filter((c) => ["Client", "Vendor", "client", "vendor"].includes(c.type))
          .map((c) => ({
            ...c,
            id: Number(c.id),
            balance: parseFloat(c.balance) || 0,
            typeNorm: String(c.type).toLowerCase(),
          }));
        if (!cancelled) {
          setAllParties(clean);
          if (!clean.some((p) => String(p.id) === String(partyId) && p.typeNorm === partyType)) {
            setPartyId("");
          }
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load clients/vendors.");
          setAllParties([]);
        }
      } finally {
        if (!cancelled) setLoadingParties(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyType]);

  const parties = useMemo(
    () =>
      allParties
        .filter((p) => p.typeNorm === partyType)
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [allParties, partyType]
  );

  const selectedParty = useMemo(
    () => parties.find((p) => String(p.id) === String(partyId)),
    [parties, partyId]
  );

  /* ------------ load receipts ------------ */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingReceipts(true);
      setError("");
      try {
        const qs = new URLSearchParams({
          party_type: partyType,
          ...(partyId ? { party_id: partyId } : {}),
          limit: String(limit),
        }).toString();
        const res = await fetch(`${api.receipts}?${qs}`);
        const j = await res.json();
        if (!cancelled) {
          setReceipts(Array.isArray(j.receipts) ? j.receipts : []);
          if (!j.success && !Array.isArray(j.receipts)) {
            setError(j.message || "Failed to load receipts.");
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load receipts.");
      } finally {
        if (!cancelled) setLoadingReceipts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [partyType, partyId, limit, refreshTick]);

  // Grouped totals by party (client/vendor)
  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of receipts) {
      const key = `${r.party_type}:${r.party_id}`;
      const entry = map.get(key) || {
        party_id: r.party_id,
        party_type: r.party_type,
        party_name: r.party_name,
        in: 0,
        out: 0,
        count: 0,
      };
      const amt = Number(r.amount) || 0;
      if (r.direction === "in") entry.in += amt; else entry.out += amt;
      entry.count += 1;
      map.set(key, entry);
    }
    let rows = Array.from(map.values());
    if (groupPartyId) {
      const pid = Number(groupPartyId);
      rows = rows.filter(x => Number(x.party_id) === pid);
    }
    rows.sort((a,b) => (b.in - b.out) - (a.in - a.out));
    return rows;
  }, [receipts, groupPartyId]);

  // Details for expanded party (receipts list + totals)
  const expanded = useMemo(() => {
    if (!expandedPartyKey) return { rows: [], totals: { tin: 0, tout: 0, net: 0 } };
    const [ptype, pidStr] = expandedPartyKey.split(":");
    const pid = Number(pidStr);
    const rows = receipts.filter(r => String(r.party_type) === String(ptype) && Number(r.party_id) === pid);
    let tin = 0, tout = 0;
    for (const r of rows) {
      const a = Number(r.amount) || 0;
      if (r.direction === "in") tin += a; else tout += a;
    }
    return { rows, totals: { tin, tout, net: tin - tout } };
  }, [expandedPartyKey, receipts]);

  /* ------------ totals ------------ */
  const totals = useMemo(() => {
    let tin = 0,
      tout = 0;
    for (const r of receipts) {
      const a = Number(r.amount) || 0;
      if (r.direction === "in") tin += a;
      else tout += a;
    }
    return { tin, tout, net: tin - tout };
  }, [receipts]);

  /* ------------ save ------------ */
  async function saveReceipt() {
    setError("");
    if (!partyId) return setError("Please select a party.");
    if (!amount || Number(amount) <= 0)
      return setError("Amount must be greater than 0.");

    setSaving(true);
    try {
      const payload = {
        direction,
        party_type: partyType,
        party_id: Number(partyId),
        amount: Number(amount),
        method,
        reference,
        note,
        created_by: loggedUser?.username, 
        account,            // bank | cash  -> updates finance_txn
        txn_date: txnDate,  // posts into finance_txn for that date
      };

      const res = await fetch(api.receipts, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();

      if (!j.success) {
        setError(j.message || "Save failed.");
        return;
      }

      // update party balance in-place
      setAllParties((prev) =>
        prev.map((p) =>
          String(p.id) === String(payload.party_id)
            ? { ...p, balance: j.party?.balance ?? p.balance }
            : p
        )
      );

      // reset fast-entry fields
      setAmount("");
      setNote("");
      setReference("");

      // table refresh + toast
      setRefreshTick((t) => t + 1);
      fireToast(`Saved ✔  ${direction.toUpperCase()} ${fmt(payload.amount)} to ${account.toUpperCase()}`);
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  function fireToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  /* ------------ UI ------------ */
  return (
    <div className="funr-wrap">
      <header className="funr-top">
        <h1>💸 All Receipts</h1>
        <div className="seg">
          <button
            className={`seg-btn ${partyType === "client" ? "active" : ""}`}
            onClick={() => {
              setPartyType("client");
              setPartyId("");
            }}
          >
            Clients
          </button>
          <button
            className={`seg-btn ${partyType === "vendor" ? "active" : ""}`}
            onClick={() => {
              setPartyType("vendor");
              setPartyId("");
            }}
          >
            Vendors
          </button>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      {/* Entry card */}
      <section className="card">
        <div className="grid">
          <div className="field">
            <label>Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="in">IN (Money In)</option>
              <option value="out">OUT (Money Out)</option>
            </select>
          </div>

          <div className="field">
            <label>Bank / Cash</label>
            <select value={account} onChange={(e) => setAccount(e.target.value)}>
              <option value="bank">Bank</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div className="field">
            <label>Date</label>
            <input
              type="date"
              value={txnDate}
              onChange={(e) => setTxnDate(e.target.value)}
            />
          </div>

          <div className="field span2">
            <label>
              Party {loadingParties && <small className="muted">loading…</small>}
            </label>
            <select value={partyId} onChange={(e) => setPartyId(e.target.value)}>
              <option value="">-- Select {partyType} --</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — Bal: {fmt(p.balance)}
                </option>
              ))}
            </select>
            {!!selectedParty && (
              <div className="mini">
                <span className="tag">Balance: {fmt(selectedParty.balance)}</span>
                <span className="muted">
                  {selectedParty.email || "-"} · {selectedParty.phone || "-"}
                </span>
              </div>
            )}
          </div>

          <div className="field">
            <label>Amount</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="field">
            <label>Method</label>
            <input
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="cash / bank / transfer"
            />
          </div>

          <div className="field">
            <label>Reference</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Receipt # / Cheque #"
            />
          </div>

          <div className="field span2">
            <label>Note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write a note…"
            />
          </div>. 

          <div className="actions span2">
            <button className="primary" onClick={saveReceipt} disabled={saving || loadingParties}>
              {saving ? "Saving…" : "Save Receipt"}
            </button>
            <div className="chips">
              <span className="chip in">IN: {fmt(totals.tin)}</span>
              <span className="chip out">OUT: {fmt(totals.tout)}</span>
              <span className={`chip ${totals.net >= 0 ? "ok" : "warn"}`}>
                NET: {fmt(totals.net)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Table card */}
      <section className="card">
        <div className="card-head">
          <h3>Recent Receipts</h3>
          <div className="toolbar" style={{ display:'flex', gap:8, alignItems:'center' }}>
            <label className="muted" style={{ display:'flex', gap:6, alignItems:'center' }}>
              <input type="checkbox" checked={groupByParty} onChange={(e)=>setGroupByParty(e.target.checked)} />
              Group by party
            </label>
            {groupByParty && (
              <select
                value={groupPartyId}
                onChange={(e)=>setGroupPartyId(e.target.value)}
                className="ghost"
                style={{ height:34, padding:'0 10px' }}
              >
                <option value="">All parties</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              title="Rows"
            >
              {[20, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              className="ghost"
              onClick={() => setRefreshTick((t) => t + 1)}
              disabled={loadingReceipts}
            >
              {loadingReceipts ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          {groupByParty ? (
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Party</th>
                  <th>Type</th>
                  <th>IN</th>
                  <th>OUT</th>
                  <th>NET</th>
                  <th>Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!grouped.length && (
                  <tr>
                    <td colSpan="8" className="center muted">No receipts</td>
                  </tr>
                )}
                {grouped.map((g) => {
                  const key = `${g.party_type}:${g.party_id}`;
                  const isOpen = expandedPartyKey === key;
                  return (
                    <>
                      <tr key={key}>
                        <td>{g.party_id}</td>
                        <td>{g.party_name}</td>
                        <td>{g.party_type}</td>
                        <td>{fmt(g.in)}</td>
                        <td>{fmt(g.out)}</td>
                        <td>{fmt(g.in - g.out)}</td>
                        <td>{g.count}</td>
                        <td>
                          <button className="ghost" onClick={() => setExpandedPartyKey(isOpen ? "" : key)}>
                            {isOpen ? "Hide receipts" : "Show receipts"}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan="8" style={{ background: '#fafafa' }}>
                            <div style={{ overflowX: 'auto' }}>
                              <table className="tbl" style={{ width:'100%' }}>
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Date/Time</th>
                                    <th>Dir</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Reference</th>
                                    <th className="right">Note</th>
                                    <th className="right">By</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {expanded.rows.map(r => (
                                    <tr key={r.id}>
                                      <td>{r.id}</td>
                                      <td>{r.created_at ? new Date(String(r.created_at).replace(' ','T')).toLocaleString() : '-'}</td>
                                      <td className={`caps ${r.direction === 'in' ? 'c-in' : 'c-out'}`}>{r.direction}</td>
                                      <td>{fmt(r.amount)}</td>
                                      <td>{r.method || '-'}</td>
                                      <td>{r.reference || '-'}</td>
                                      <td className="right">
                                        <div style={{ maxWidth: 180, overflowX: "auto", whiteSpace: "nowrap" }}>
                                          {r.note || '-'}
                                        </div>
                                      </td>
                                      <td className="right">{r.created_by || '-'}</td>
                                    </tr>
                                  ))}
                                  {expanded.rows.length === 0 && (
                                    <tr><td colSpan="8" className="center muted">No receipts</td></tr>
                                  )}
                                </tbody>
                                <tfoot>
                                  <tr>
                                    <td colSpan="3">Totals</td>
                                    <td className="right">{fmt(expanded.totals.net)} (net)</td>
                                    <td colSpan="4" className="right">
                                      IN {fmt(expanded.totals.tin)} / OUT {fmt(expanded.totals.tout)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date/Time</th>
                  <th>Party</th>
                  <th>Type</th>
                  <th>Dir</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Note</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {!receipts.length && (
                  <tr>
                    <td colSpan="10" className="center muted">
                      No receipts yet
                    </td>
                  </tr>
                )}
                {receipts.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>
                      {r.created_at
                        ? new Date(String(r.created_at).replace(" ", "T")).toLocaleString()
                        : "-"}
                    </td>
                    <td>{r.party_name}</td>
                    <td className="caps">{r.party_type}</td>
                    <td className={`caps ${r.direction === "in" ? "c-in" : "c-out"}`}>
                      {r.direction}
                    </td>
                    <td>{fmt(r.amount)}</td>
                    <td style={{ maxWidth: 180, overflow: "auto", whiteSpace: "nowrap" }}>
                      <div style={{ maxWidth: 180, overflowX: "auto", whiteSpace: "nowrap" }}>
                        {r.method || ""}
                      </div>
                    </td>
                    <td style={{ maxWidth: 220, overflow: "auto", whiteSpace: "nowrap" }}>
                      <div style={{ maxWidth: 220, overflowX: "auto", whiteSpace: "nowrap" }}>
                        {r.reference || ""}
                      </div>
                    </td>
                    <td>
                      <td style={{ maxWidth: 180, overflow: "auto", whiteSpace: "nowrap" }}>
                  <div style={{ maxWidth: 180, overflowX: "auto", whiteSpace: "nowrap" }}>
                    {r.note || ""}
                  </div>
                </td>
                    </td>
                    <td>{r.created_by || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* styles */}
      <style>{`
        :root {
          --bg:#f7f8fb; --card:#fff; --bd:#e9eef5; --txt:#1e293b; --muted:#6b7280;
          --pri:#4f46e5; --pri-weak:#eef2ff; --ok:#0a7a2d; --warn:#b00020;
        }
        .funr-wrap { max-width: 1400px; margin: 0 auto; padding: 16px; background: var(--bg); min-height: 100vh; }
        .funr-top { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom: 12px; }
        .funr-top h1 { margin:0; font-size: 24px; }
        .seg { display:inline-flex; border:1px solid var(--bd); border-radius: 12px; overflow:hidden; }
        .seg-btn { padding:8px 12px; border:0; background:#fff; cursor:pointer; }
        .seg-btn.active { background: var(--pri-weak); color: var(--pri); font-weight: 700; }

        .card { background: var(--card); border: 1px solid var(--bd); border-radius: 14px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,.03); margin-bottom: 14px; }
        .card-head { display:flex; align-items:center; justify-content:space-between; gap: 12px; margin-bottom: 10px; }
        .toolbar { display:flex; gap:8px; }

        .grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; }
        .field { display:flex; flex-direction:column; gap:6px; }
        .field input, .field select { height: 40px; border:1px solid var(--bd); border-radius: 10px; padding: 0 12px; background:#fff; }
        .field label { font-size: 12px; color: var(--muted); }
        .span2 { grid-column: span 2; }
        .mini { display:flex; gap:8px; align-items:center; margin-top:6px; flex-wrap:wrap; }
        .tag { background:#f3f4f6; border:1px solid var(--bd); padding: 2px 8px; border-radius: 999px; font-size: 12px; }
        .muted { color: var(--muted); }

        .actions { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .primary { background: var(--pri); color:#fff; border:0; border-radius: 10px; height: 40px; padding: 0 18px; cursor:pointer; transition: transform .05s ease-in; }
        .primary:active { transform: translateY(1px); }
        .chips { display:flex; gap:8px; flex-wrap:wrap; }
        .chip { padding:6px 10px; border-radius:999px; border:1px solid var(--bd); font-weight:700; }
        .chip.in { background:#ecfdf5; }
        .chip.out { background:#fff1f2; }
        .chip.ok { background:#ecfdf5; }
        .chip.warn { background:#fff7ed; }

        .table-wrap { overflow:auto; }
        .tbl { width:100%; border-collapse: collapse; }
        .tbl th, .tbl td { border-bottom: 1px solid var(--bd); padding: 10px; font-size: 14px; }
        .tbl th { text-align: left; color: var(--muted); font-weight: 700; }
        .right { text-align: right; }
        .center { text-align: center; }
        .caps { text-transform: uppercase; font-size: 12px; letter-spacing: .03em; }
        .c-in { color: var(--ok); font-weight: 800; }
        .c-out { color: var(--warn); font-weight: 800; }

        .alert { background:#fff1f2; border:1px solid #ffe4e6; color:#991b1b; padding:10px 12px; border-radius:10px; margin-bottom:10px; }
        .ghost { background:transparent; border:1px solid var(--bd); border-radius: 10px; height: 34px; padding: 0 10px; cursor: pointer; }

        .toast {
          position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
          background: #111827; color: #fff; padding: 10px 14px; border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,.25); opacity: 0; animation: pop 0.2s ease-out forwards, fade 2.2s ease-out forwards;
        }
        @keyframes pop { to { opacity: 1; transform: translateX(-50%) scale(1.02); } }
        @keyframes fade { 0%{opacity:1} 80%{opacity:1} 100%{opacity:0} }

        @media (max-width: 820px) {
          .grid { grid-template-columns: 1fr; }
          .span2 { grid-column: auto; }
          .actions { flex-direction: column; align-items: stretch; }
        }
      `}</style>
    </div>
  );
}
