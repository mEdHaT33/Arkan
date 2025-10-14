import React, { useEffect, useState, useCallback } from "react";
import ClientsPage from "./ClientsPage";

/* =========================
   API base helper (CRA + Vite safe)
   ========================= */
// ===== API base (hard-set to your backend) =====
const API_BASE = "https://arkanaltafawuq.com/arkan-system"; // ← no trailing slash

const joinUrl = (base, path) => {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return b && p ? `${b}/${p}` : (b || p);
};

const API = (path) => {
  const url = joinUrl(API_BASE, path);
  // quick guard for Safari "string did not match the expected pattern"
  if (!/^https?:\/\/[^ ]+$/i.test(url)) {
    console.error("Bad API URL:", url);
    throw new Error("Bad API URL");
  }
  return url;
};

/* =========================
   Small UI bits
   ========================= */
const Card = ({ title, value }) => (
  <div style={{border:"1px solid #eee", borderRadius:12, padding:16, boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
    <div style={{fontSize:14, color:"#666"}}>{title}</div>
    <div style={{fontSize:22, fontWeight:700, marginTop:6}}>{Number(value || 0).toFixed(2)}</div>
  </div>
);

/* =========================
   Main component
   ========================= */
export default function FinancePage() {
  const [summary, setSummary] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    category_id: "",
    account: "",
    direction: ""
  });

  const [form, setForm] = useState({
    txn_date: new Date().toISOString().slice(0,10),
    category_id: "",
    account: "bank",     // bank | cash
    direction: "out",    // in | out
    amount: "",
    note: "",
    user: (() => {
      try {
        const u = JSON.parse(localStorage.getItem("loggedUser") || "{}");
        return u?.username || "finance";
      } catch { return "finance"; }
    })()
  });

  // Parties (clients/vendors) for linking transactions to a party
  const [partyType, setPartyType] = useState("client"); // client | vendor
  const [partyId, setPartyId] = useState("");
  const [allParties, setAllParties] = useState([]);
  const [loadingParties, setLoadingParties] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingParties(true);
        const res = await fetch(API("get_clients.php"));
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
          // reset selection if current is not in filtered group
          if (!clean.some((p) => String(p.id) === String(partyId) && p.typeNorm === partyType)) {
            setPartyId("");
          }
        }
      } catch {
        if (!cancelled) {
          setAllParties([]);
        }
      } finally {
        if (!cancelled) setLoadingParties(false);
      }
    })();
    return () => { setLoadingParties(false); cancelled = true; };
  }, [partyType]);

  const parties = React.useMemo(
    () => allParties
      .filter((p) => p.typeNorm === partyType)
      .sort((a,b) => String(a.name).localeCompare(String(b.name))),
    [allParties, partyType]
  );

  const loadSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      setError("");
      const res = await fetch(API("finance_get_summary.php"), { headers:{ "Content-Type":"application/json" }});
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || "Failed to load summary");
      setSummary(data);
    } catch (e) {
      setError(`Summary error: ${e.message}`);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const calculateRunningBalances = (transactions) => {
    let cashBalance = 0;
    let bankBalance = 0;
    
    // Calculate running balances from oldest to newest
    return transactions
      .slice() // Create a copy to avoid mutating the original array
      .sort((a, b) => new Date(a.txn_date) - new Date(b.txn_date) || a.id - b.id)
      .map(txn => {
        // Calculate the effect of this transaction on balances
        const amount = parseFloat(txn.amount) * (txn.direction === 'in' ? 1 : -1);
        
        if (txn.account.toLowerCase() === 'cash') {
          cashBalance += amount;
        } else if (txn.account.toLowerCase() === 'bank') {
          bankBalance += amount;
        }
        
        // Return the transaction with calculated balances
        return {
          ...txn,
          cash_balance_after: txn.account.toLowerCase() === 'cash' ? cashBalance : null,
          bank_balance_after: txn.account.toLowerCase() === 'bank' ? bankBalance : null
        };
      })
      .reverse(); // Show newest first
  };

  const loadTxns = async () => {
    try {
      setLoadingTxns(true);
      setError("");
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_,v]) => v !== "" && v !== null))
      ).toString();
      const res = await fetch(API(`finance_get_transactions.php${qs ? `?${qs}` : ""}`), { headers:{"Content-Type":"application/json" }});
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || "Failed to load transactions");
      
      // Calculate running balances and update transactions
      const transactionsWithBalances = calculateRunningBalances(data.transactions);
      setTxns(transactionsWithBalances);
    } catch (e) {
      setError(`Transactions error: ${e.message}`);
    } finally {
      setLoadingTxns(false);
    }
  };

  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { loadTxns(); }, [filters]);

  const submitTxn = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const payload = {
        ...form,
        amount: parseFloat(form.amount || "0")
      };
      if (!payload.category_id) throw new Error("Please select a category");
      if (!payload.amount || payload.amount <= 0) throw new Error("Amount must be greater than 0");
      if (!["bank","cash"].includes(payload.account)) throw new Error("Account must be Bank or Cash");
      if (!["in","out"].includes(payload.direction)) throw new Error("Direction must be In or Out");

      // Attach selected party (optional)
      if (partyId) {
        payload.party_type = partyType;   // client | vendor
        payload.party_id = Number(partyId);
      }

      const res = await fetch(API("finance_add_transaction.php"), {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || "Failed to add transaction");

      // refresh
      setForm(f => ({ ...f, amount:"", note:"" }));
      await loadSummary();
      await loadTxns();
      alert("Transaction added");
    } catch (e2) {
      setError(`Add transaction error: ${e2.message}`);
    }
  };

  const categories = summary?.categories ?? [];
  const bank = summary?.balances?.bank ?? 0;
  const cash = summary?.balances?.cash ?? 0;
  const wh   = summary?.warehouse?.total_value ?? 0;

  const totalIn  = summary?.totals?.in_all_time ?? 0;
  const totalOut = summary?.totals?.out_all_time ?? 0;

  // Totals for the visible table (respect current Account filter)
  const tableTotals = React.useMemo(() => {
    let inSum = 0;
    let outSum = 0;
    const wantedAccount = String(filters.account || "").toLowerCase();
    for (const t of txns) {
      const acc = String(t.account || "").toLowerCase();
      if (wantedAccount && acc !== wantedAccount) continue; // extra guard (API already filters)
      const amt = Number(t.amount) || 0;
      const dir = String(t.direction || "").toLowerCase();
      if (dir === "in") inSum += amt; else if (dir === "out") outSum += amt;
    }
    return { inSum, outSum };
  }, [txns, filters.account]);

  return (
    <div style={{padding:"24px", maxWidth:1200, margin:"0 auto"}}>
      <h1 style={{marginBottom:16}}>Finance Dashboard</h1>

      {/* API base hint */}
      {/* <div style={{fontSize:12, color:"#777", marginBottom:12}}>
        API Base: <code>{API_BASE || "(same-origin)"}</code>
      </div> */}

      {error && (
        <div style={{background:"#ffe6e6", border:"1px solid #ffcccc", color:"#a40000", padding:"10px 12px", borderRadius:8, marginBottom:16}}>
          {error}
        </div>
      )}

      {/* Balances */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24}}>
        <Card title="Bank Balance" value={bank} />
        <Card title="Cash Balance" value={cash} />
        <Card title="Total In (All time)" value={totalIn} />
        <Card title="Total Out (All time)" value={totalOut} />
      </div>

      {/* Warehouse & Receipts */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24}}>
        <Card title="Warehouse Total Value" value={wh} />
        <Card title="Receipts In" value={summary?.receipts?.in ?? 0} />
        <Card title="Receipts Out" value={summary?.receipts?.out ?? 0} />
      </div>

      {/* Add Transaction */}
      <section style={{marginBottom:24}}>
        <h2>Add Transaction</h2>
        <form onSubmit={submitTxn} style={{display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, alignItems:"end"}}>
          <div>
            <label>Date</label>
            <input type="date" value={form.txn_date} onChange={e=>setForm({...form, txn_date:e.target.value})} />
          </div>
          <div>
            <label>Category</label>
            <select value={form.category_id} onChange={e=>setForm({...form, category_id:e.target.value})}>
              <option value="">Select...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.kind})</option>)}
            </select>
          </div>
          <div>
            <label>Direction</label>
            <select value={form.direction} onChange={e=>setForm({...form, direction:e.target.value})}>
              <option value="out">Out (Expense)</option>
              <option value="in">In (Income)</option>
            </select>
          </div>
          <div>
            <label>From / To</label>
            <select value={form.account} onChange={e=>setForm({...form, account:e.target.value})}>
              <option value="bank">Bank</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div>
            <label>Amount</label>
            <input type="number" step="0.01" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})}/>
          </div>
          <div style={{gridColumn:"span 2"}}>
            <label>Note</label>
            <input type="text" value={form.note} onChange={e=>setForm({...form, note:e.target.value})}/>
          </div>
          <div>
            <label>Party Type</label>
            <select value={partyType} onChange={e=>setPartyType(e.target.value)}>
              <option value="client">Client</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
          <div>
            <label>Party {loadingParties && <small style={{color:'#777'}}>loading…</small>}</label>
            <select value={partyId} onChange={e=>setPartyId(e.target.value)}>
              <option value="">-- Select --</option>
              {parties.map(p => (
                <option key={p.id} value={p.id}>{p.name} — Bal: {(Number(p.balance)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</option>
              ))}
            </select>
          </div>
          <div>
            <button type="submit">Add</button>
          </div>
        </form>
      </section>

      {/* Filters */}
      <section style={{marginBottom:12}}>
        <h2>Transactions</h2>
        <div style={{display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12}}>
          <div>
            <label>From</label>
            <input type="date" value={filters.from} onChange={e=>setFilters({...filters, from:e.target.value})}/>
          </div>
          <div>
            <label>To</label>
            <input type="date" value={filters.to} onChange={e=>setFilters({...filters, to:e.target.value})}/>
          </div>
          <div>
            <label>Category</label>
            <select value={filters.category_id} onChange={e=>setFilters({...filters, category_id:e.target.value})}>
              <option value="">All</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label>Account</label>
            <select value={filters.account} onChange={e=>setFilters({...filters, account:e.target.value})}>
              <option value="">All</option>
              <option value="bank">Bank</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div>
            <label>Direction</label>
            <select value={filters.direction} onChange={e=>setFilters({...filters, direction:e.target.value})}>
              <option value="">All</option>
              <option value="in">In</option>
              <option value="out">Out</option>
            </select>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"flex-end"}}>
            <button onClick={()=>setFilters({from:"",to:"",category_id:"",account:"",direction:""})}>Reset</button>
            <button onClick={loadTxns}>Refresh</button>
          </div>
        </div>
      </section>

      {/* Table */}
      <div style={{overflowX:"auto"}}>
        <table width="100%" cellPadding="8" style={{borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#f5f5f5"}}>
              <th>Date</th>
              <th>Category</th>
              <th>Kind</th>
              <th>Account</th>
              <th>Dir</th>
              <th>Amount</th>
              <th>Note</th>
              <th>By</th>
              <th style={{textAlign:'right'}}>Cash After</th><th style={{textAlign:'right'}}>Bank After</th>
            </tr>
          </thead>
          <tbody>
            {txns.map(t => (
              <tr key={t.id}>
                <td>{t.txn_date}</td>
                <td>{t.category}</td>
                <td>{t.kind}</td>
                <td>{t.account}</td>
                <td>{t.direction}</td>
                <td>{Number(t.amount).toFixed(2)}</td>
                <td style={{ maxWidth: 180, overflow: "auto", whiteSpace: "nowrap" }}>
                  <div style={{ maxWidth: 180, overflowX: "auto", whiteSpace: "nowrap" }}>
                    {t.note || ""}
                  </div>
                </td>
                <td>{t.created_by || ""}</td>
                <td style={{textAlign:'right', fontFamily: 'monospace'}}>
                  {t.cash_balance_after == null ? '—' : Number(t.cash_balance_after).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </td>
                <td style={{textAlign:'right', fontFamily: 'monospace'}}>
                  {t.bank_balance_after == null ? '—' : Number(t.bank_balance_after).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </td>
              </tr>
            ))}
            {(!loadingTxns && txns.length===0) && (
              <tr><td colSpan="10" style={{textAlign:"center", padding:"24px"}}>No transactions</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: "#fafafa", fontWeight: 700 }}>
              <td colSpan="5">
                Totals {filters.account ? `(${filters.account})` : "(All accounts)"}
                <td>
                {tableTotals.inSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in
                {"  /  "}
                {tableTotals.outSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} out
               
                </td>
              </td>
         
              <td colSpan="4"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Clients & Vendors Balance Editor */}
      <ClientsPage onUpdate={loadSummary} API={API} />

      {/* Backend diagnostics (from PHP file) */}
      {summary?.diagnostics?.length > 0 && (
        <div style={{marginTop:16, fontSize:12, color:"#666"}}>
          <strong>Diagnostics:</strong>
          <ul>
            {summary.diagnostics.map((d,i)=><li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
