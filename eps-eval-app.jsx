import { useState, useCallback, useRef } from "react";

const NIVEAUX = [
  { v: 1, label: "1", short: "INS", color: "#ef4444", desc: "Maîtrise insuffisante" },
  { v: 2, label: "2", short: "FRA", color: "#f97316", desc: "Maîtrise fragile" },
  { v: 3, label: "3", short: "SAT", color: "#eab308", desc: "Maîtrise satisfaisante" },
  { v: 4, label: "4", short: "TBM", color: "#22c55e", desc: "Très bonne maîtrise" },
];
const CHAMPS = { CA1: "Produire une performance", CA2: "S'adapter", CA3: "S'exprimer", CA4: "Entretenir" };
const CHAMP_ICONS = { CA1: "🏆", CA2: "🏃", CA3: "🎭", CA4: "💪" };
const CALCUL_LABELS = {
  moyenne: "Moyenne", capitalisation: "Capitalisation", validation: "Validation",
  meilleure: "Meilleure note", sans_extremes: "Sans extrêmes", progressif: "Coeff. progressifs", items: "Par items",
};
const CALCUL_COLORS = {
  moyenne: "#3b82f6", capitalisation: "#8b5cf6", validation: "#f97316",
  meilleure: "#06b6d4", sans_extremes: "#84cc16", progressif: "#f59e0b", items: "#ec4899",
};
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const getNiveauColor = v => NIVEAUX.find(n => n.v === v)?.color ?? "#374151";

// ── Données initiales ─────────────────────────────────────────────────────────
const INITIAL_DATA = {
  anneeScolaire: "2025-2026",
  classes: [
    {
      id: "c1", nom: "3ème A",
      eleves: [
        { id: "e1", prenom: "Lucas", nom: "Martin" },
        { id: "e2", prenom: "Emma", nom: "Dupont" },
        { id: "e3", prenom: "Noah", nom: "Bernard" },
        { id: "e4", prenom: "Léa", nom: "Thomas" },
        { id: "e5", prenom: "Hugo", nom: "Petit" },
        { id: "e6", prenom: "Chloé", nom: "Robert" },
      ],
    },
    {
      id: "c2", nom: "2nde B",
      eleves: [
        { id: "e7", prenom: "Jade", nom: "Simon" },
        { id: "e8", prenom: "Tom", nom: "Michel" },
        { id: "e9", prenom: "Inès", nom: "Leroy" },
      ],
    },
  ],
  apsas: [
    {
      id: "a1", nom: "Badminton", champ: "CA1",
      competences: [
        { id: "cp1", nom: "Maîtrise technique", type: "specifique", notation: "standard", calcul: "moyenne", coeff: 2 },
        { id: "cp2", nom: "Stratégie de jeu", type: "specifique", notation: "standard", calcul: "moyenne", coeff: 1 },
        { id: "cp3", nom: "Arbitrage", type: "transversale", notation: "standard", calcul: "validation", seuil: 3, coeff: 1 },
      ],
    },
    {
      id: "a2", nom: "Acrosport", champ: "CA3",
      competences: [
        { id: "cp4", nom: "Chorégraphie", type: "specifique", notation: "standard", calcul: "capitalisation", coeff: 1, modeEval: "collectif_ajust" },
        { id: "cp5", nom: "Coopération", type: "transversale", notation: "standard", calcul: "moyenne", coeff: 1, modeEval: "collectif" },
        { id: "cp6", nom: "Sécurité", type: "transversale", notation: "standard", calcul: "validation", seuil: 4, coeff: 1, modeEval: "collectif" },
      ],
    },
    {
      id: "a3", nom: "Course longue", champ: "CA2",
      competences: [
        { id: "cp7", nom: "Performance", type: "specifique", notation: "standard", calcul: "meilleure", coeff: 2 },
        { id: "cp8", nom: "Régulation de l'effort", type: "specifique", notation: "standard", calcul: "progressif", coeff: 1 },
      ],
    },
    {
      id: "a4", nom: "Gymnastique au sol", champ: "CA3",
      competences: [
        {
          id: "cp9", nom: "Réalisation des figures", type: "specifique", notation: "items", calcul: "items", coeff: 1, plafond: 7.5,
          seuils: [
            { min: 0, max: 2.5, niveau: 1 },
            { min: 2.5, max: 4, niveau: 2 },
            { min: 4, max: 7, niveau: 3 },
            { min: 7, max: 7.5, niveau: 4 },
          ],
          familles: [
            { id: "f1", nom: "Roulade avant", figures: [
              { id: "fig1a", nom: "Roulade avant groupée", niveau: 1, points: 1.0 },
              { id: "fig1b", nom: "Roulade avant relevé 1 jambe", niveau: 2, points: 0.5 },
              { id: "fig1c", nom: "Roulade surélevée", niveau: 3, points: 0.5 },
            ]},
            { id: "f2", nom: "Roue et rondade", figures: [
              { id: "fig2a", nom: "Roue", niveau: 1, points: 1.0 },
              { id: "fig2b", nom: "Double roue", niveau: 2, points: 0.5 },
              { id: "fig2c", nom: "Rondade", niveau: 3, points: 0.5 },
            ]},
            { id: "f3", nom: "ATR", figures: [
              { id: "fig3a", nom: "ATR passager (1 jambe)", niveau: 1, points: 1.0 },
              { id: "fig3b", nom: "ATR avec parade", niveau: 2, points: 0.5 },
              { id: "fig3c", nom: "ATR 3 secondes", niveau: 3, points: 0.5 },
            ]},
            { id: "f4", nom: "Saut", figures: [
              { id: "fig4a", nom: "Demi-tour", niveau: 1, points: 1.0 },
              { id: "fig4b", nom: "Saut de chat", niveau: 2, points: 0.5 },
              { id: "fig4c", nom: "360°", niveau: 3, points: 0.5 },
            ]},
            { id: "f5", nom: "Tenue au sol", figures: [
              { id: "fig5a", nom: "Planche demi-tour", niveau: 1, points: 1.0 },
              { id: "fig5b", nom: "Chandelle", niveau: 2, points: 0.5 },
              { id: "fig5c", nom: "Trépied", niveau: 3, points: 0.5 },
            ]},
          ],
        },
      ],
    },
  ],
  evaluations: {},
  evalItems: {},
};

// ── Calculs ───────────────────────────────────────────────────────────────────
function getEvals(data, classeId, apsaId, compId, eleveId) {
  return data.evaluations?.[classeId]?.[apsaId]?.[compId]?.[eleveId] ?? [];
}

function calcNote(evals, calcul) {
  const vals = evals.map(e => e.niveau).filter(v => v > 0);
  if (!vals.length) return null;
  switch (calcul) {
    case "moyenne": return vals.reduce((s, v) => s + v, 0) / vals.length;
    case "capitalisation": return vals[vals.length - 1];
    case "meilleure": return Math.max(...vals);
    case "validation": return vals[vals.length - 1];
    case "sans_extremes":
      if (vals.length <= 2) return vals.reduce((s, v) => s + v, 0) / vals.length;
      const sorted = [...vals].sort((a, b) => a - b);
      return sorted.slice(1, -1).reduce((s, v) => s + v, 0) / (vals.length - 2);
    case "progressif":
      let total = 0, coeffSum = 0;
      vals.forEach((v, i) => { const c = i + 1; total += v * c; coeffSum += c; });
      return Math.max(total / coeffSum, Math.max(...vals));
    default: return vals[vals.length - 1];
  }
}

function gymScore(data, classeId, apsaId, eleveId, comp) {
  if (!comp?.familles) return 0;
  let total = 0;
  for (const fam of comp.familles) {
    const niv1 = fam.figures.find(f => f.niveau === 1);
    const niv1done = data.evalItems?.[classeId]?.[apsaId]?.[eleveId]?.[niv1.id]?.valide ?? false;
    for (const fig of fam.figures) {
      const done = data.evalItems?.[classeId]?.[apsaId]?.[eleveId]?.[fig.id]?.valide ?? false;
      if (fig.niveau === 1 && done) total += fig.points;
      else if (fig.niveau > 1 && niv1done && done) total += fig.points;
    }
  }
  return Math.min(total, comp.plafond ?? 99);
}

function gymNiveau(score, seuils) {
  if (!score || score <= 0) return null;
  for (const s of [...seuils].reverse()) {
    if (score >= s.min) return s;
  }
  return seuils[0];
}

function getNoteFinale(data, classeId, apsaId, comp, eleveId) {
  if (comp.notation === "items") {
    const score = gymScore(data, classeId, apsaId, eleveId, comp);
    const niv = gymNiveau(score, comp.seuils);
    return { score, niveau: niv?.niveau ?? 0, isItems: true };
  }
  const evals = getEvals(data, classeId, apsaId, comp.id, eleveId);
  const note = calcNote(evals, comp.calcul);
  return { score: note, niveau: note ? Math.round(note) : 0, isItems: false };
}

// ── Styles communs ────────────────────────────────────────────────────────────
const S = {
  page: { padding: "20px 16px 100px", minHeight: "100vh" },
  backBtn: { background: "none", border: "none", cursor: "pointer", padding: "0 0 4px", color: "#6b7280", fontSize: 13, fontWeight: 600 },
  card: { background: "#1a2235", border: "1px solid #2d3748", borderRadius: 14, padding: "14px 16px", marginBottom: 10 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #2d3748", background: "#0f1420", color: "#f1f5f9", fontSize: 14, outline: "none", boxSizing: "border-box" },
  btn: (color = "#3b82f6", outline = false) => ({ padding: "10px 18px", borderRadius: 8, border: outline ? `1px solid ${color}` : "none", background: outline ? "transparent" : color, color: outline ? color : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }),
  label: { color: "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 4, display: "block" },
};

// ── Composants UI ─────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: color + "22", color, border: `1px solid ${color}44` }}>{label}</span>;
}

function NiveauBtn({ value, current, onChange }) {
  const n = NIVEAUX.find(x => x.v === value);
  const active = current === value;
  return (
    <button onClick={() => onChange(value)} title={n.desc} style={{
      width: 40, height: 40, borderRadius: 8, border: "none", cursor: "pointer",
      fontWeight: 800, fontSize: 14,
      background: active ? n.color : "#0f1420",
      color: active ? "#fff" : n.color,
      boxShadow: active ? `0 0 0 2px ${n.color}` : `inset 0 0 0 1px ${n.color}44`,
      transition: "all .15s",
    }}>{n.label}</button>
  );
}

function ProgressBar({ value, max, color }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: "#2d3748", overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: color, borderRadius: 3, transition: "width .4s" }} />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "#111827", borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "20px 16px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#f1f5f9" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "#1a2235", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer", borderRadius: 8, padding: "4px 10px" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Tabs({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
      {options.map(([val, label]) => (
        <button key={val} onClick={() => onChange(val)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: value === val ? "#3b82f6" : "#1a2235", color: value === val ? "#fff" : "#6b7280" }}>{label}</button>
      ))}
    </div>
  );
}

// ── Application principale ────────────────────────────────────────────────────

// ── SaisieScreen extrait comme vrai composant React (useState/useRef stables) ─
function SaisieScreenComp({ data, comp, apsa, classe, sel, addEval, replaceLastEval, onTerminer }) {
  const [noteJour, setNoteJour] = useState({});
  // On utilise un ref d'objet simple pour tracker les premiers taps
  // La clé `key={comp.id}` sur ce composant garantit que le state repart vierge à chaque nouvelle compétence
  const premiersTapsRef = useRef({});

  const allEvals = classe?.eleves.map(e => getNoteFinale(data, sel.classeId, sel.apsaId, comp, e.id).niveau).filter(v => v > 0) ?? [];
  const avg = allEvals.length ? (allEvals.reduce((a, b) => a + b, 0) / allEvals.length).toFixed(2) : "—";
  const saisiesCount = Object.keys(noteJour).length;

  function handleNiveau(eleveId, val) {
    const premierTap = !(eleveId in premiersTapsRef.current);
    premiersTapsRef.current[eleveId] = true;
    setNoteJour(s => ({ ...s, [eleveId]: val }));
    if (premierTap) {
      addEval(sel.classeId, sel.apsaId, comp.id, eleveId, val);
    } else {
      replaceLastEval(sel.classeId, sel.apsaId, comp.id, eleveId, val);
    }
  }

  return (
    <div style={S.page}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>{comp.nom}</h1>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Badge label={CALCUL_LABELS[comp.calcul]} color={CALCUL_COLORS[comp.calcul]} />
            {comp.seuil && <Badge label={"Seuil : " + comp.seuil} color="#f97316" />}
            {comp.coeff > 1 && <Badge label={"Coeff x" + comp.coeff} color="#6b7280" />}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
        {classe?.eleves.map(e => {
          const note = getNoteFinale(data, sel.classeId, sel.apsaId, comp, e.id);
          const evals = getEvals(data, sel.classeId, sel.apsaId, comp.id, e.id);
          const niveauCeJour = noteJour[e.id] ?? 0;
          const dejaSaisi = niveauCeJour > 0;
          const borderColor = dejaSaisi ? getNiveauColor(niveauCeJour) + "99" : "#2d3748";
          return (
            <div key={e.id} style={{ ...S.card, marginBottom: 0, display: "flex", alignItems: "center", gap: 10, border: "1px solid " + borderColor }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>{e.prenom} {e.nom}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 2, alignItems: "center" }}>
                  {evals.length > 0 && (
                    <span style={{ fontSize: 11, color: "#6b7280" }}>
                      {evals.length} eval. - <span style={{ color: getNiveauColor(note.niveau), fontWeight: 700 }}>{typeof note.score === "number" ? note.score.toFixed(1) : note.score}</span>
                    </span>
                  )}
                  {dejaSaisi && <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>note</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {NIVEAUX.map(n => (
                  <NiveauBtn key={n.v} value={n.v} current={niveauCeJour} onChange={val => handleNiveau(e.id, val)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...S.card, marginTop: 16 }}>
        <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>BILAN SEANCE</div>
        <div style={{ display: "flex", gap: 24 }}>
          <div><div style={{ color: "#6b7280", fontSize: 11 }}>MOY. HISTORIQUE</div><div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20 }}>{avg}</div></div>
          <div><div style={{ color: "#6b7280", fontSize: 11 }}>SAISIS CE JOUR</div><div style={{ color: saisiesCount > 0 ? "#22c55e" : "#6b7280", fontWeight: 800, fontSize: 20 }}>{saisiesCount}/{classe?.eleves.length}</div></div>
          <div><div style={{ color: "#6b7280", fontSize: 11 }}>RESTANTS</div><div style={{ color: (classe?.eleves.length ?? 0) - saisiesCount > 0 ? "#ef4444" : "#22c55e", fontWeight: 800, fontSize: 20 }}>{(classe?.eleves.length ?? 0) - saisiesCount}</div></div>
        </div>
      </div>

      {/* Bouton fixe en bas — toujours visible même sans scroll */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "12px 16px 24px", background: "linear-gradient(transparent, #0f1420 40%)", zIndex: 50 }}>
        <button onClick={onTerminer} style={{
          width: "100%", padding: "16px 0", borderRadius: 12, cursor: "pointer",
          fontWeight: 800, fontSize: 15,
          background: saisiesCount > 0 ? "#22c55e" : "#374151",
          color: "#fff",
          border: "none",
        }}>
          {saisiesCount > 0
            ? ("✓ Terminer la saisie — " + saisiesCount + " élève" + (saisiesCount > 1 ? "s" : "") + " évalué" + (saisiesCount > 1 ? "s" : ""))
            : "Terminer sans saisie"}
        </button>
      </div>
    </div>
  );
}


// ── PrestationComp — évaluation collective ────────────────────────────────────
function PrestationComp({ data, apsa, classe, sel, addEval, replaceLastEval, toggleItemForEleve, onRetour }) {
  const [etape, setEtape] = useState("selection"); // selection | saisie
  const [groupe, setGroupe] = useState([]); // [eleveId, ...]
  // noteGroupe[compId] = niveau collectif saisi
  const [noteGroupe, setNoteGroupe] = useState({});
  // ajustements[compId][eleveId] = niveau individuel (si différent)
  const [ajustements, setAjustements] = useState({});
  // prestationsRef : tracker premier tap par comp+eleve pour ne pas doubler
  const premiersTapsRef = useRef({});

  const elevesDuGroupe = groupe.map(id => classe?.eleves.find(e => e.id === id)).filter(Boolean);
  // Compétences collectives standard (niveaux 1-4)
  const compsColl = apsa?.competences.filter(cp => (cp.modeEval === "collectif" || cp.modeEval === "collectif_ajust") && cp.notation !== "items") ?? [];
  // Compétences collectives par items
  const compsCollItems = apsa?.competences.filter(cp => (cp.modeEval === "collectif" || cp.modeEval === "collectif_ajust") && cp.notation === "items") ?? [];
  // Compétences individuelles (standard ou items)
  const compsIndiv = apsa?.competences.filter(cp => !cp.modeEval || cp.modeEval === "individuel") ?? [];

  function toggleEleve(id) {
    if (groupe.includes(id)) {
      setGroupe(g => g.filter(x => x !== id));
    } else if (groupe.length < 4) {
      setGroupe(g => [...g, id]);
    }
  }

  function confirmerGroupe() {
    if (groupe.length < 2) return;
    setNoteGroupe({});
    setAjustements({});
    premiersTapsRef.current = {};
    setEtape("saisie");
  }

  function groupeSuivant() {
    setGroupe([]);
    setNoteGroupe({});
    setAjustements({});
    premiersTapsRef.current = {};
    setEtape("selection");
  }

  function handleCollectif(compId, val) {
    setNoteGroupe(s => ({ ...s, [compId]: val }));
    // Appliquer à tous les élèves du groupe
    groupe.forEach(eleveId => {
      const key = compId + "_" + eleveId;
      const premier = !(key in premiersTapsRef.current);
      premiersTapsRef.current[key] = true;
      if (premier) {
        addEval(sel.classeId, sel.apsaId, compId, eleveId, val);
      } else {
        replaceLastEval(sel.classeId, sel.apsaId, compId, eleveId, val);
      }
    });
    // Réinitialiser les ajustements pour cette compétence
    setAjustements(a => ({ ...a, [compId]: {} }));
  }

  function handleAjustement(compId, eleveId, val) {
    setAjustements(a => ({ ...a, [compId]: { ...(a[compId] ?? {}), [eleveId]: val } }));
    const key = compId + "_ajust_" + eleveId;
    const premier = !(key in premiersTapsRef.current);
    premiersTapsRef.current[key] = true;
    if (premier) {
      addEval(sel.classeId, sel.apsaId, compId, eleveId, val);
    } else {
      replaceLastEval(sel.classeId, sel.apsaId, compId, eleveId, val);
    }
  }

  function handleIndividuel(compId, eleveId, val) {
    const key = compId + "_indiv_" + eleveId;
    const premier = !(key in premiersTapsRef.current);
    premiersTapsRef.current[key] = true;
    if (premier) {
      addEval(sel.classeId, sel.apsaId, compId, eleveId, val);
    } else {
      replaceLastEval(sel.classeId, sel.apsaId, compId, eleveId, val);
    }
  }

  function getNiveauIndiv(compId, eleveId) {
    return ajustements[compId]?.[eleveId] ?? noteGroupe[compId] ?? 0;
  }

  // Toggle une figure pour tous les membres du groupe (items collectif)
  function toggleItemGroupe(classeId, apsaId, compId, figId, val) {
    groupe.forEach(eleveId => {
      // Appeler toggleItem pour chaque élève du groupe
      const key = "item_" + compId + "_" + figId + "_" + eleveId;
      premiersTapsRef.current[key] = true;
    });
    // On retourne la fonction à appeler dans App via un callback
    groupe.forEach(eleveId => {
      toggleItemForEleve(classeId, apsaId, eleveId, figId, val);
    });
  }

  if (etape === "selection") {
    return (
      <div style={S.page}>
        <button onClick={onRetour} style={S.backBtn}>← {apsa?.nom}</button>
        <h1 style={{ margin: "6px 0 4px", fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>Prestation collective</h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
          Sélectionnez 2 à 4 élèves qui passent ensemble
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: groupe.length >= 2 ? "#22c55e" : "#6b7280", fontWeight: 700 }}>
            {groupe.length} élève{groupe.length > 1 ? "s" : ""} sélectionné{groupe.length > 1 ? "s" : ""} {groupe.length >= 4 ? "(max)" : ""}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 100 }}>
          {classe?.eleves.map(e => {
            const selected = groupe.includes(e.id);
            const disabled = !selected && groupe.length >= 4;
            return (
              <button key={e.id} onClick={() => !disabled && toggleEleve(e.id)} style={{
                padding: "12px 16px", borderRadius: 10, border: "none", cursor: disabled ? "not-allowed" : "pointer",
                textAlign: "left", fontWeight: 700, fontSize: 14,
                background: selected ? "#0ea5e922" : "#1a2235",
                color: selected ? "#38bdf8" : disabled ? "#374151" : "#e2e8f0",
                border: selected ? "2px solid #0ea5e9" : "1px solid #2d3748",
                display: "flex", alignItems: "center", gap: 12,
                opacity: disabled ? 0.4 : 1,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: selected ? "#0ea5e9" : "#2d3748", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 800, flexShrink: 0 }}>
                  {selected ? "✓" : ""}
                </div>
                {e.prenom} {e.nom}
              </button>
            );
          })}
        </div>

        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "12px 16px 24px", background: "linear-gradient(transparent, #0f1420 40%)", zIndex: 50 }}>
          <button onClick={confirmerGroupe} style={{
            width: "100%", padding: "16px 0", borderRadius: 12, border: "none", cursor: groupe.length >= 2 ? "pointer" : "not-allowed",
            fontWeight: 800, fontSize: 15,
            background: groupe.length >= 2 ? "#0ea5e9" : "#374151",
            color: "#fff",
          }}>
            {groupe.length >= 2 ? "✓ Confirmer le groupe (" + groupe.length + " élèves)" : "Sélectionnez au moins 2 élèves"}
          </button>
        </div>
      </div>
    );
  }

  // Étape saisie
  return (
    <div style={S.page}>
      <button onClick={() => setEtape("selection")} style={S.backBtn}>← Modifier le groupe</button>
      <div style={{ margin: "6px 0 16px" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>Prestation collective</h1>
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {elevesDuGroupe.map(e => (
            <span key={e.id} style={{ padding: "3px 10px", borderRadius: 20, background: "#0ea5e922", color: "#38bdf8", fontSize: 12, fontWeight: 700, border: "1px solid #0ea5e944" }}>
              {e.prenom} {e.nom}
            </span>
          ))}
        </div>
      </div>

      {/* Compétences collectives */}
      {compsColl.length > 0 && (
        <>
          <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>COMPÉTENCES COLLECTIVES</div>
          {compsColl.map(cp => {
            const niveauColl = noteGroupe[cp.id] ?? 0;
            return (
              <div key={cp.id} style={{ ...S.card, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#e2e8f0" }}>{cp.nom}</div>
                  <Badge label={cp.modeEval === "collectif_ajust" ? "👥✏️" : "👥"} color="#0ea5e9" />
                </div>
                {/* Boutons collectifs */}
                <div style={{ display: "flex", gap: 4, marginBottom: niveauColl > 0 && cp.modeEval === "collectif_ajust" ? 12 : 0 }}>
                  {NIVEAUX.map(n => (
                    <NiveauBtn key={n.v} value={n.v} current={niveauColl} onChange={val => handleCollectif(cp.id, val)} />
                  ))}
                  <span style={{ fontSize: 11, color: "#6b7280", alignSelf: "center", marginLeft: 4 }}>→ tous</span>
                </div>
                {/* Ajustements individuels */}
                {niveauColl > 0 && cp.modeEval === "collectif_ajust" && (
                  <div>
                    <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 6 }}>Ajuster individuellement :</div>
                    {elevesDuGroupe.map(e => {
                      const nivIndiv = ajustements[cp.id]?.[e.id] ?? niveauColl;
                      const ajuste = ajustements[cp.id]?.[e.id] !== undefined;
                      return (
                        <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ flex: 1, fontSize: 13, color: ajuste ? "#f1f5f9" : "#9ca3af", fontWeight: ajuste ? 700 : 400 }}>
                            {e.prenom} {e.nom}
                            {ajuste && <span style={{ marginLeft: 6, fontSize: 10, color: "#f59e0b" }}>ajusté</span>}
                          </div>
                          <div style={{ display: "flex", gap: 3 }}>
                            {NIVEAUX.map(n => (
                              <NiveauBtn key={n.v} value={n.v} current={nivIndiv} onChange={val => handleAjustement(cp.id, e.id, val)} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Compétences collectives par items */}
      {compsCollItems.length > 0 && (
        <>
          <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 8, marginTop: 8, letterSpacing: 1 }}>ITEMS COLLECTIFS</div>
          {compsCollItems.map(cp => {
            const score = gymScore(data, sel.classeId, sel.apsaId, elevesDuGroupe[0]?.id, cp);
            const niv = gymNiveau(score, cp.seuils);
            return (
              <div key={cp.id} style={{ ...S.card, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#e2e8f0" }}>{cp.nom}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Badge label="👥 Items" color="#ec4899" />
                    {niv && <div style={{ padding: "3px 8px", borderRadius: 6, background: getNiveauColor(niv.niveau) + "22", color: getNiveauColor(niv.niveau), fontWeight: 800, fontSize: 14 }}>{niv.niveau}</div>}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>
                  Score : <strong style={{ color: niv ? getNiveauColor(niv.niveau) : "#6b7280" }}>{score.toFixed(1)}</strong> / {cp.plafond} pts — Cocher une figure la valide pour tout le groupe
                </div>
                {cp.familles.map(fam => {
                  const niv1 = fam.figures.find(f => f.niveau === 1);
                  const niv1done = data.evalItems?.[sel.classeId]?.[sel.apsaId]?.[elevesDuGroupe[0]?.id]?.[niv1.id]?.valide ?? false;
                  return (
                    <div key={fam.id} style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>{fam.nom}</div>
                      {fam.figures.map(fig => {
                        const locked = fig.niveau > 1 && !niv1done;
                        const checked = locked ? false : (data.evalItems?.[sel.classeId]?.[sel.apsaId]?.[elevesDuGroupe[0]?.id]?.[fig.id]?.valide ?? false);
                        return (
                          <div key={fig.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, opacity: locked ? 0.35 : 1 }}>
                            <button onClick={() => !locked && toggleItemGroupe(sel.classeId, sel.apsaId, cp.id, fig.id, !checked)} style={{ width: 28, height: 28, borderRadius: 6, border: "2px solid " + (checked ? "#22c55e" : "#374151"), background: checked ? "#22c55e22" : "transparent", cursor: locked ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: checked ? "#22c55e" : "#374151", transition: "all .15s", flexShrink: 0 }}>{checked ? "✓" : ""}</button>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 13, color: checked ? "#e2e8f0" : "#9ca3af", fontWeight: checked ? 700 : 400 }}>{fig.nom}</span>
                              {locked && <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 4 }}>🔒</span>}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: fig.niveau === 1 ? "#22c55e" : "#6b7280" }}>+{fig.points}pt</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>
      )}

      {/* Compétences individuelles */}
      {compsIndiv.length > 0 && (
        <>
          <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 8, marginTop: 8, letterSpacing: 1 }}>COMPÉTENCES INDIVIDUELLES</div>
          {compsIndiv.map(cp => (
            <div key={cp.id} style={{ ...S.card, marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#e2e8f0", marginBottom: 10 }}>{cp.nom}</div>
              {elevesDuGroupe.map(e => {
                const note = getNoteFinale(data, sel.classeId, sel.apsaId, cp, e.id);
                const evals = getEvals(data, sel.classeId, sel.apsaId, cp.id, e.id);
                const key = cp.id + "_indiv_" + e.id;
                const niveauCeJour = premiersTapsRef.current["_local_" + key] ?? 0;
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700 }}>{e.prenom} {e.nom}</div>
                      {evals.length > 0 && <div style={{ fontSize: 10, color: "#6b7280" }}>{evals.length} éval. · {typeof note.score === "number" ? note.score.toFixed(1) : "—"}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {NIVEAUX.map(n => {
                        const localKey = "_local_" + cp.id + "_indiv_" + e.id;
                        const cur = premiersTapsRef.current[localKey] ?? 0;
                        return (
                          <NiveauBtn key={n.v} value={n.v} current={cur} onChange={val => {
                            premiersTapsRef.current[localKey] = val;
                            handleIndividuel(cp.id, e.id, val);
                          }} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </>
      )}

      <div style={{ height: 100 }} />
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "12px 16px 24px", background: "linear-gradient(transparent, #0f1420 40%)", zIndex: 50 }}>
        <button onClick={groupeSuivant} style={{ width: "100%", padding: "16px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 15, background: "#0ea5e9", color: "#fff" }}>
          👥 Groupe suivant
        </button>
      </div>
    </div>
  );
}


// ── CreateItemsScreen — création d'une compétence par items ──────────────────
function CreateItemsScreen({ apsaId, onSave, onCancel }) {
  const [etape, setEtape] = useState("nom"); // nom | familles | figures | seuils | recap
  const [nom, setNom] = useState("");
  const [type, setType] = useState("specifique");
  const [modeEval, setModeEval] = useState("individuel");
  const [coeff, setCoeff] = useState("1");
  const [plafond, setPlafond] = useState("");
  const [familles, setFamilles] = useState([]); // [{id,nom,figures:[{id,nom,niveau,points}]}]
  const [famIndex, setFamIndex] = useState(0); // famille en cours d'édition
  const [newFamNom, setNewFamNom] = useState("");
  const [newFigNom, setNewFigNom] = useState("");
  const [newFigNiveau, setNewFigNiveau] = useState(1);
  const [newFigPoints, setNewFigPoints] = useState("1");
  const [seuils, setSeuils] = useState([
    { min: 0, max: 0, niveau: 1 },
    { min: 0, max: 0, niveau: 2 },
    { min: 0, max: 0, niveau: 3 },
    { min: 0, max: 0, niveau: 4 },
  ]);

  const NIVEAUX_DESC = ["Maîtrise insuffisante","Maîtrise fragile","Maîtrise satisfaisante","Très bonne maîtrise"];

  function addFamille() {
    if (!newFamNom.trim()) return;
    setFamilles(f => [...f, { id: "f" + Date.now(), nom: newFamNom.trim(), figures: [] }]);
    setNewFamNom("");
  }

  function deleteFamille(id) {
    setFamilles(f => f.filter(x => x.id !== id));
  }

  function addFigure(famId) {
    if (!newFigNom.trim()) return;
    setFamilles(f => f.map(fam => fam.id !== famId ? fam : {
      ...fam,
      figures: [...fam.figures, { id: "fig" + Date.now(), nom: newFigNom.trim(), niveau: newFigNiveau, points: parseFloat(newFigPoints) || 1 }]
    }));
    setNewFigNom("");
  }

  function deleteFigure(famId, figId) {
    setFamilles(f => f.map(fam => fam.id !== famId ? fam : { ...fam, figures: fam.figures.filter(fig => fig.id !== figId) }));
  }

  function updateSeuil(index, field, val) {
    setSeuils(s => s.map((x, i) => i === index ? { ...x, [field]: parseFloat(val) || 0 } : x));
  }

  function handleSave() {
    const newComp = {
      id: "cp" + Date.now(),
      nom: nom.trim(),
      type,
      modeEval,
      notation: "items",
      calcul: "items",
      coeff: parseFloat(coeff) || 1,
      plafond: parseFloat(plafond) || 10,
      seuils,
      familles,
    };
    onSave(newComp);
  }

  const canNext = {
    nom: nom.trim().length > 0,
    familles: familles.length > 0,
    figures: familles.every(f => f.figures.length > 0),
    seuils: plafond && seuils.every(s => s.max > 0),
  };

  // ── Étape NOM ──────────────────────────────────────────────────────────────
  if (etape === "nom") return (
    <div style={S.page}>
      <button onClick={onCancel} style={S.backBtn}>← Annuler</button>
      <h1 style={{ margin: "8px 0 4px", fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>Nouvelle compétence</h1>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>Capitalisation par items</p>

      <div style={S.card}>
        <label style={S.label}>NOM DE LA COMPÉTENCE</label>
        <input style={{ ...S.input, marginBottom: 16 }} placeholder="ex. Réalisation des figures" value={nom} onChange={e => setNom(e.target.value)} autoFocus />

        <label style={S.label}>TYPE</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[["specifique","Spécifique"],["transversale","Transversale"]].map(([v,l]) => (
            <button key={v} onClick={() => setType(v)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: type === v ? "#3b82f6" : "#0f1420", color: type === v ? "#fff" : "#6b7280" }}>{l}</button>
          ))}
        </div>

        <label style={S.label}>MODE D'ÉVALUATION</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {[["individuel","👤 Individuelle"],["collectif","👥 Collective"],["collectif_ajust","👥✏️ Collective+ajust"]].map(([v,l]) => (
            <button key={v} onClick={() => setModeEval(v)} style={{ flex: 1, padding: "8px 6px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: modeEval === v ? "#3b82f6" : "#0f1420", color: modeEval === v ? "#fff" : "#6b7280", whiteSpace: "nowrap" }}>{l}</button>
          ))}
        </div>

        <label style={S.label}>COEFFICIENT</label>
        <input style={S.input} type="number" min="0.5" max="5" step="0.5" value={coeff} onChange={e => setCoeff(e.target.value)} />
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "12px 16px 24px", background: "linear-gradient(transparent, #0f1420 40%)", zIndex: 50 }}>
        <button onClick={() => setEtape("familles")} disabled={!canNext.nom} style={{ width: "100%", padding: "16px 0", borderRadius: 12, border: "none", cursor: canNext.nom ? "pointer" : "not-allowed", fontWeight: 800, fontSize: 15, background: canNext.nom ? "#3b82f6" : "#374151", color: "#fff" }}>
          Suivant → Familles
        </button>
      </div>
    </div>
  );

  // ── Étape FAMILLES ─────────────────────────────────────────────────────────
  if (etape === "familles") return (
    <div style={S.page}>
      <button onClick={() => setEtape("nom")} style={S.backBtn}>← Retour</button>
      <h1 style={{ margin: "8px 0 4px", fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>Familles</h1>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>Créez les grandes catégories de la compétence</p>

      {familles.map((fam, i) => (
        <div key={fam.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#3b82f622", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#3b82f6", fontSize: 13 }}>{i+1}</div>
          <div style={{ flex: 1, color: "#e2e8f0", fontWeight: 700 }}>{fam.nom}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>{fam.figures.length} fig.</div>
          <button onClick={() => deleteFamille(fam.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16 }}>🗑</button>
        </div>
      ))}

      <div style={S.card}>
        <label style={S.label}>NOUVELLE FAMILLE</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...S.input, flex: 1 }} placeholder="ex. Roulade avant" value={newFamNom} onChange={e => setNewFamNom(e.target.value)} />
          <button onClick={addFamille} style={{ ...S.btn(), padding: "10px 14px", flexShrink: 0 }}>+</button>
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "12px 16px 24px", background: "linear-gradient(transparent, #0f1420 40%)", zIndex: 50 }}>
        <button onClick={() => { setFamIndex(0); setEtape("figures"); }} disabled={!canNext.familles} style={{ width: "100%", padding: "16px 0", borderRadius: 12, border: "none", cursor: canNext.familles ? "pointer" : "not-allowed", fontWeight: 800, fontSize: 15, background: canNext.familles ? "#3b82f6" : "#374151", color: "#fff" }}>
          Suivant → Figures ({familles.length} famille{familles.length > 1 ? "s" : ""})
        </button>
      </div>
    </div>
  );

  // ── Étape FIGURES ──────────────────────────────────────────────────────────
  if (etape === "figures") {
    const fam = familles[famIndex];
    return (
      <div style={S.page}>
        <button onClick={() => famIndex === 0 ? setEtape("familles") : setFamIndex(i => i - 1)} style={S.backBtn}>← {famIndex === 0 ? "Familles" : familles[famIndex-1].nom}</button>
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {familles.map((f, i) => (
            <div key={f.id} style={{ width: 8, height: 8, borderRadius: 4, background: i === famIndex ? "#3b82f6" : i < famIndex ? "#22c55e" : "#2d3748" }} />
          ))}
        </div>
        <h1 style={{ margin: "8px 0 4px", fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>{fam.nom}</h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>Ajoutez les figures de cette famille</p>

        {fam.figures.map(fig => (
          <div key={fig.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}>{fig.nom}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>Niveau {fig.niveau}</span>
                <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>+{fig.points} pt{fig.points > 1 ? "s" : ""}</span>
              </div>
            </div>
            <button onClick={() => deleteFigure(fam.id, fig.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16 }}>🗑</button>
          </div>
        ))}

        <div style={S.card}>
          <label style={S.label}>NOUVELLE FIGURE</label>
          <input style={{ ...S.input, marginBottom: 10 }} placeholder="ex. Roulade avant groupée" value={newFigNom} onChange={e => setNewFigNom(e.target.value)} />
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>NIVEAU</label>
              <div style={{ display: "flex", gap: 4 }}>
                {[1,2,3].map(v => (
                  <button key={v} onClick={() => setNewFigNiveau(v)} style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 800, background: newFigNiveau === v ? "#3b82f6" : "#0f1420", color: newFigNiveau === v ? "#fff" : "#6b7280" }}>{v}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>POINTS</label>
              <input style={S.input} type="number" min="0.5" step="0.5" value={newFigPoints} onChange={e => setNewFigPoints(e.target.value)} />
            </div>
          </div>
          <button onClick={() => addFigure(fam.id)} disabled={!newFigNom.trim()} style={{ ...S.btn(), width: "100%", opacity: newFigNom.trim() ? 1 : 0.4 }}>+ Ajouter la figure</button>
        </div>

        <div style={{ height: 90 }} />
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "12px 16px 24px", background: "linear-gradient(transparent, #0f1420 40%)", zIndex: 50 }}>
          <button onClick={() => {
            if (famIndex < familles.length - 1) { setFamIndex(i => i + 1); setNewFigNom(""); }
            else setEtape("seuils");
          }} disabled={fam.figures.length === 0} style={{ width: "100%", padding: "16px 0", borderRadius: 12, border: "none", cursor: fam.figures.length > 0 ? "pointer" : "not-allowed", fontWeight: 800, fontSize: 15, background: fam.figures.length > 0 ? "#3b82f6" : "#374151", color: "#fff" }}>
            {famIndex < familles.length - 1 ? "Famille suivante →" : "Suivant → Seuils"}
          </button>
        </div>
      </div>
    );
  }

  // ── Étape SEUILS ───────────────────────────────────────────────────────────
  if (etape === "seuils") {
    const totalMax = familles.reduce((sum, fam) => sum + fam.figures.reduce((s, fig) => s + fig.points, 0), 0);
    return (
      <div style={S.page}>
        <button onClick={() => setEtape("figures")} style={S.backBtn}>← Figures</button>
        <h1 style={{ margin: "8px 0 4px", fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>Seuils de maîtrise</h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>
          Total max possible : <strong style={{ color: "#f1f5f9" }}>{totalMax.toFixed(1)} pts</strong>
        </p>

        <div style={S.card}>
          <label style={S.label}>PLAFOND DE POINTS</label>
          <input style={{ ...S.input, marginBottom: 4 }} type="number" min="1" step="0.5" placeholder={"ex. " + totalMax.toFixed(1)} value={plafond} onChange={e => setPlafond(e.target.value)} />
          <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 0 }}>Le score ne dépassera pas cette valeur</div>
        </div>

        {seuils.map((s, i) => (
          <div key={i} style={{ ...S.card, border: "1px solid " + getNiveauColor(s.niveau) + "33" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: getNiveauColor(s.niveau) + "22", border: "1px solid " + getNiveauColor(s.niveau) + "66", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: getNiveauColor(s.niveau) }}>{s.niveau}</div>
              <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 14 }}>{NIVEAUX_DESC[i]}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>DE (pts)</label>
                <input style={S.input} type="number" min="0" step="0.5" value={s.min} onChange={e => updateSeuil(i, "min", e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>À (pts)</label>
                <input style={S.input} type="number" min="0" step="0.5" value={s.max} onChange={e => updateSeuil(i, "max", e.target.value)} />
              </div>
            </div>
          </div>
        ))}

        <div style={{ height: 90 }} />
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "12px 16px 24px", background: "linear-gradient(transparent, #0f1420 40%)", zIndex: 50 }}>
          <button onClick={() => setEtape("recap")} disabled={!plafond} style={{ width: "100%", padding: "16px 0", borderRadius: 12, border: "none", cursor: plafond ? "pointer" : "not-allowed", fontWeight: 800, fontSize: 15, background: plafond ? "#3b82f6" : "#374151", color: "#fff" }}>
            Suivant → Récapitulatif
          </button>
        </div>
      </div>
    );
  }

  // ── Étape RÉCAP ────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <button onClick={() => setEtape("seuils")} style={S.backBtn}>← Seuils</button>
      <h1 style={{ margin: "8px 0 16px", fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>Récapitulatif</h1>

      <div style={S.card}>
        <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>COMPÉTENCE</div>
        <div style={{ fontWeight: 900, fontSize: 18, color: "#f1f5f9", marginBottom: 8 }}>{nom}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Plafond : <strong style={{ color: "#f1f5f9" }}>{plafond} pts</strong></span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Coeff : <strong style={{ color: "#f1f5f9" }}>{coeff}</strong></span>
        </div>
      </div>

      {familles.map(fam => (
        <div key={fam.id} style={S.card}>
          <div style={{ fontWeight: 800, color: "#e2e8f0", marginBottom: 8 }}>{fam.nom}</div>
          {fam.figures.map(fig => (
            <div key={fig.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>Niv.{fig.niveau} — {fig.nom}</span>
              <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 700 }}>+{fig.points}pt</span>
            </div>
          ))}
        </div>
      ))}

      <div style={{ height: 90 }} />
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "12px 16px 24px", background: "linear-gradient(transparent, #0f1420 40%)", zIndex: 50 }}>
        <button onClick={handleSave} style={{ width: "100%", padding: "16px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 15, background: "#22c55e", color: "#fff" }}>
          ✓ Créer la compétence
        </button>
      </div>
    </div>
  );
}


// ── Helpers Organisation ──────────────────────────────────────────────────────

// ── ScoreParlantTesteur ───────────────────────────────────────────────────────
function ScoreParlantTesteur() {
  const [scoreTest, setScoreTest] = useState("");
  const config = { actif: true };
  const niv = scoreTest.length >= 3 ? lireMaitrise(scoreTest, config) : null;
  const s = scoreTest.replace(/[^0-9]/g, "");

  function getDetail() {
    if (s.length === 3) {
      const c = parseInt(s[0]), d = parseInt(s[1]), u = parseInt(s[2]);
      return `Centaines (${c}) ${c > d+u ? ">" : "≤"} Dizaines+Unités (${d}+${u}=${d+u})`;
    }
    if (s.length === 4) {
      const m = parseInt(s[0]), c = parseInt(s[1]), d = parseInt(s[2]), u = parseInt(s[3]);
      const cond1 = m + c > d + u;
      const cond2 = m > c;
      return `Mill.+Cent. (${m}+${c}=${m+c}) ${cond1 ? ">" : "≤"} Diz.+Unit. (${d}+${u}=${d+u})${cond1 ? (cond2 ? ` · Mill.(${m}) > Cent.(${c}) → Niv.4` : ` → Niv.3`) : ""}`;
    }
    return "";
  }

  return (
    <div>
      <input
        style={{ ...S.input, fontSize: 20, fontWeight: 900, textAlign: "center", letterSpacing: 4, marginBottom: 8 }}
        type="text" inputMode="numeric" maxLength={4}
        placeholder="ex. 0851"
        value={scoreTest}
        onChange={e => setScoreTest(e.target.value.replace(/[^0-9]/g, ""))}
      />
      {s.length >= 3 && (
        <div style={{ padding: "10px 12px", borderRadius: 8, background: niv ? getNiveauColor(niv) + "22" : "#1a2235", border: "1px solid " + (niv ? getNiveauColor(niv) + "44" : "#2d3748") }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: niv ? getNiveauColor(niv) : "#6b7280", marginBottom: 4 }}>
            {niv ? `Niveau ${niv} — ${NIVEAUX.find(n => n.v === niv)?.desc}` : "Objectif non atteint"}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>{getDetail()}</div>
        </div>
      )}
      {/* Règles de lecture */}
      <div style={{ marginTop: 10 }}>
        <div style={{ color: "#6b7280", fontSize: 10, fontWeight: 700, marginBottom: 6 }}>RÈGLES DE LECTURE</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
          <strong style={{ color: "#e2e8f0" }}>3 chiffres :</strong> Centaines {">"} Dizaines + Unités → Niv.3
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>
          <strong style={{ color: "#e2e8f0" }}>4 chiffres :</strong> Milliers + Centaines {">"} Dizaines + Unités → Niv.3
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>
          + Milliers {">"} Centaines → Niv.4 · (milliers peut être 0, ex: 0851)
        </div>
      </div>
    </div>
  );
}

// ── Helpers calendriers ───────────────────────────────────────────────────────

// Score parlant
function lireMaitrise(score, config) {
  if (!config || !config.actif) return null;
  // Conserver le score tel que saisi (chaîne) pour garder les zéros initiaux
  const s = String(score).replace(/[^0-9]/g, "");
  // Normaliser à 3 ou 4 chiffres selon la longueur réelle
  if (s.length === 3) {
    const c = parseInt(s[0]), d = parseInt(s[1]), u = parseInt(s[2]);
    if (c > d + u) return 3;
    return null;
  }
  if (s.length === 4) {
    const mil = parseInt(s[0]), c = parseInt(s[1]), d = parseInt(s[2]), u = parseInt(s[3]);
    // mil peut être 0 (ex: 0851)
    if (mil + c > d + u && mil > c) return 4;
    if (mil + c > d + u) return 3;
    return null;
  }
  return null;
}

// Génère round-robin pour une liste d'équipes
function roundRobin(equipes) {
  const n = equipes.length;
  const eqs = n % 2 === 0 ? equipes : [...equipes, { id: "bye", nom: "Exempt" }];
  const total = eqs.length;
  const rondes = [];
  const fixed = eqs[0];
  const rotating = eqs.slice(1);
  for (let r = 0; r < total - 1; r++) {
    const matchs = [];
    const current = [fixed, ...rotating];
    for (let i = 0; i < total / 2; i++) {
      const a = current[i], b = current[total - 1 - i];
      if (a.id !== "bye" && b.id !== "bye") {
        matchs.push({ id: `r${r}m${i}`, equipeA: a, equipeB: b, scoreA: null, scoreB: null });
      }
    }
    rondes.push({ num: r + 1, matchs });
    rotating.unshift(rotating.pop());
  }
  return rondes;
}

// Génère poules équilibrées
function genPoules(equipes, nbTerrains) {
  const n = equipes.length;
  const props = [];

  // Essayer toutes les combinaisons de poules de taille 3 et 4
  // Objectif : placer toutes les équipes sans reste
  for (let nb3 = 0; nb3 <= Math.floor(n / 3); nb3++) {
    for (let nb4 = 0; nb4 <= Math.floor(n / 4); nb4++) {
      if (nb3 * 3 + nb4 * 4 !== n) continue;
      if (nb3 + nb4 === 0) continue;
      const terrainsNeeded = nb3 + nb4;
      if (terrainsNeeded > nbTerrains) continue;

      let label = "";
      if (nb3 > 0 && nb4 > 0) {
        label = `${nb3} poule${nb3 > 1 ? "s" : ""} de 3 + ${nb4} poule${nb4 > 1 ? "s" : ""} de 4`;
      } else if (nb3 > 0) {
        label = `${nb3} poule${nb3 > 1 ? "s" : ""} de 3`;
      } else {
        label = `${nb4} poule${nb4 > 1 ? "s" : ""} de 4`;
      }
      label += ` · ${terrainsNeeded} terrain${terrainsNeeded > 1 ? "s" : ""}`;

      // Éviter les doublons
      const key = nb3 + "_" + nb4;
      if (!props.find(p => p.key === key)) {
        props.push({ key, label, nb3, nb4, nbPoules: nb3 + nb4, terrainsNeeded });
      }
    }
  }

  // Si aucune solution parfaite, proposer avec une poule du reste
  if (props.length === 0) {
    for (let taille of [3, 4]) {
      const nbPoules = Math.floor(n / taille);
      const reste = n % taille;
      if (nbPoules === 0 || reste === 0) continue;
      // La poule du reste doit avoir au moins 2 équipes pour être jouable
      if (reste < 2) continue;
      const terrainsNeeded = nbPoules + 1;
      if (terrainsNeeded > nbTerrains) continue;
      const label = `${nbPoules} poule${nbPoules > 1 ? "s" : ""} de ${taille} + 1 poule de ${reste} · ${terrainsNeeded} terrain${terrainsNeeded > 1 ? "s" : ""}`;
      props.push({ key: "mixed_" + taille, label, nb3: taille === 3 ? nbPoules : 0, nb4: taille === 4 ? nbPoules : 0, nbPouleExtra: 1, tailleExtra: reste, nbPoules: nbPoules + 1, terrainsNeeded });
    }
  }

  return props.sort((a, b) => a.terrainsNeeded - b.terrainsNeeded);
}

// Ronde suisse : appaire les équipes de même score
function rondesSuisses(equipes, scores, ronde) {
  const sorted = [...equipes].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  const matchs = [];
  const used = new Set();
  for (let i = 0; i < sorted.length - 1; i++) {
    if (used.has(sorted[i].id)) continue;
    for (let j = i + 1; j < sorted.length; j++) {
      if (used.has(sorted[j].id)) continue;
      matchs.push({ id: `rs${ronde}m${i}`, equipeA: sorted[i], equipeB: sorted[j], scoreA: null, scoreB: null });
      used.add(sorted[i].id);
      used.add(sorted[j].id);
      break;
    }
  }
  return { num: ronde, matchs };
}

// ── OrganisationComp ───────────────────────────────────────────────────────────
function OrganisationComp({ data, addEval, onRetour }) {
  const [etape, setEtape] = useState("params");
  const [classeId, setClasseId] = useState(null);
  const [apsaId, setApsaId] = useState(null);
  const [format, setFormat] = useState(null); // "poules"|"championnat"|"suisse"
  const [nbEquipes, setNbEquipes] = useState("");
  const [nbTerrains, setNbTerrains] = useState("");
  const [propChoisie, setPropChoisie] = useState(null);
  const [equipes, setEquipes] = useState([]);
  const [rondes, setRondes] = useState([]);
  const [rondeActive, setRondeActive] = useState(0);
  const [scores, setScores] = useState({}); // eqId -> pts
  const [matchEnCours, setMatchEnCours] = useState(null);
  const [scoreInput, setScoreInput] = useState({ a: "", b: "" });
  const [scoreParlant, setScoreParlant] = useState({ actif: false, compId: null });
  const [matchsCustom, setMatchsCustom] = useState([]); // phase finale manuelle

  const classe = data.classes.find(c => c.id === classeId);
  const apsa = data.apsas.find(a => a.id === apsaId);
  const COULEURS = ["#3b82f6","#ef4444","#22c55e","#f59e0b","#8b5cf6","#ec4899","#06b6d4","#84cc16"];

  function initEquipes(n) {
    const eqs = Array.from({ length: n }, (_, i) => ({
      id: "eq" + i, nom: "Équipe " + (i + 1), couleur: COULEURS[i % COULEURS.length]
    }));
    setEquipes(eqs);
    return eqs;
  }

  function genCalendrier(eqs) {
    if (format === "poules" && propChoisie) {
      const rs = [];
      // Construire la liste des poules selon nb3, nb4 et éventuellement tailleExtra
      const poules = [];
      let cursor = 0;
      // Poules de 3
      for (let i = 0; i < (propChoisie.nb3 ?? 0); i++) {
        poules.push(eqs.slice(cursor, cursor + 3));
        cursor += 3;
      }
      // Poules de 4
      for (let i = 0; i < (propChoisie.nb4 ?? 0); i++) {
        poules.push(eqs.slice(cursor, cursor + 4));
        cursor += 4;
      }
      // Poule du reste (cas fallback)
      if (propChoisie.tailleExtra && cursor < eqs.length) {
        poules.push(eqs.slice(cursor));
      }
      // Générer round-robin pour chaque poule
      poules.forEach((eqPoule, idx) => {
        if (eqPoule.length < 2) return;
        const rondesPoule = roundRobin(eqPoule).map(r => ({ ...r, poule: idx + 1 }));
        rs.push(...rondesPoule);
      });
      return rs;
    }
    if (format === "championnat") {
      return roundRobin(eqs);
    }
    if (format === "suisse") {
      const sc = {};
      eqs.forEach(e => { sc[e.id] = 0; });
      return [rondesSuisses(eqs, sc, 1)];
    }
    return [];
  }

  function lancerRencontres() {
    const eqs = initEquipes(parseInt(nbEquipes));
    const cal = genCalendrier(eqs);
    setRondes(cal);
    setRondeActive(0);
    const sc = {};
    eqs.forEach(e => { sc[e.id] = 0; });
    setScores(sc);
    setEtape("match");
  }

  function validerScore(matchId) {
    const sA = parseFloat(scoreInput.a), sB = parseFloat(scoreInput.b);
    if (isNaN(sA) || isNaN(sB)) return;

    setRondes(rs => rs.map(r => ({
      ...r,
      matchs: r.matchs.map(m => m.id !== matchId ? m : { ...m, scoreA: sA, scoreB: sB })
    })));

    const m = rondes.flatMap(r => r.matchs).find(x => x.id === matchId);
    if (m) {
      setScores(sc => {
        const n = { ...sc };
        if (!n[m.equipeA.id]) n[m.equipeA.id] = 0;
        if (!n[m.equipeB.id]) n[m.equipeB.id] = 0;
        if (sA > sB) { n[m.equipeA.id] += 3; }
        else if (sB > sA) { n[m.equipeB.id] += 3; }
        else { n[m.equipeA.id] += 1; n[m.equipeB.id] += 1; }
        return n;
      });
    }
    setMatchEnCours(null);
    setScoreInput({ a: "", b: "" });
  }

  function ajouterRondeSuisse() {
    const newRonde = rondesSuisses(equipes, scores, rondes.length + 1);
    setRondes(rs => [...rs, newRonde]);
    setRondeActive(rondes.length);
  }

  function ajouterMatchCustom() {
    setMatchsCustom(ms => [...ms, { id: "custom" + Date.now(), nomA: "", nomB: "", scoreA: null, scoreB: null }]);
  }

  function cloturerSeance() {
    if (!scoreParlant.actif || !scoreParlant.compId || !classeId || !apsaId) { onRetour(); return; }
    const tousMatchs = [...rondes.flatMap(r => r.matchs), ...matchsCustom].filter(m => m.scoreA !== null);
    // Accumuler les niveaux par élève (on utilisera la moyenne)
    const niveauxParEquipe = {};
    tousMatchs.forEach(m => {
      const nA = lireMaitrise(m.scoreA, scoreParlant);
      const nB = lireMaitrise(m.scoreB, scoreParlant);
      if (!niveauxParEquipe[m.equipeA.id]) niveauxParEquipe[m.equipeA.id] = [];
      if (!niveauxParEquipe[m.equipeB.id]) niveauxParEquipe[m.equipeB.id] = [];
      if (nA) niveauxParEquipe[m.equipeA.id].push(nA);
      if (nB) niveauxParEquipe[m.equipeB.id].push(nB);
    });
    // Reporter — pour l'instant les équipes n'ont pas d'élèves assignés
    // donc on note juste visuellement (sera connecté quand on ajoute la composition)
    onRetour();
  }

  const classementTrié = equipes.length
    ? [...equipes].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
    : [];

  const rondeActuelle = rondes[rondeActive];
  const tousMachtsJoués = rondeActuelle?.matchs.every(m => m.scoreA !== null);

  // ── ÉTAPE PARAMS ────────────────────────────────────────────────────────────
  if (etape === "params") return (
    <div style={S.page}>
      <button onClick={onRetour} style={S.backBtn}>← Accueil</button>
      <h1 style={{ margin: "8px 0 20px", fontSize: 22, fontWeight: 900, color: "#f1f5f9" }}>🏅 Organisation</h1>

      <div style={S.card}>
        <label style={S.label}>CLASSE</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {data.classes.map(c => (
            <button key={c.id} onClick={() => setClasseId(c.id)} style={{ padding: "10px 14px", borderRadius: 8, border: classeId === c.id ? "1px solid #3b82f644" : "1px solid #1a2235", cursor: "pointer", textAlign: "left", fontWeight: 700, fontSize: 14, background: classeId === c.id ? "#3b82f622" : "#0f1420", color: classeId === c.id ? "#3b82f6" : "#9ca3af" }}>{c.nom}</button>
          ))}
        </div>
        <label style={S.label}>APSA</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.apsas.map(a => (
            <button key={a.id} onClick={() => setApsaId(a.id)} style={{ padding: "10px 14px", borderRadius: 8, border: apsaId === a.id ? "1px solid #3b82f644" : "1px solid #1a2235", cursor: "pointer", textAlign: "left", fontWeight: 700, fontSize: 14, background: apsaId === a.id ? "#3b82f622" : "#0f1420", color: apsaId === a.id ? "#3b82f6" : "#9ca3af" }}>{a.nom}</button>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <label style={S.label}>FORMAT</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[["poules","🏆 Poules"],["championnat","⚔️ Championnat"],["suisse","🔀 Ronde suisse"]].map(([v,l]) => (
            <button key={v} onClick={() => { setFormat(v); setPropChoisie(null); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: format === v ? "#3b82f6" : "#0f1420", color: format === v ? "#fff" : "#6b7280" }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>NB ÉQUIPES</label>
            <input style={S.input} type="number" min="2" max="20" placeholder="ex. 6" value={nbEquipes} onChange={e => { setNbEquipes(e.target.value); setPropChoisie(null); }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>NB TERRAINS</label>
            <input style={S.input} type="number" min="1" max="10" placeholder="ex. 3" value={nbTerrains} onChange={e => setNbTerrains(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Propositions pour les poules */}
      {format === "poules" && nbEquipes && nbTerrains && (
        <div style={S.card}>
          <label style={S.label}>PROPOSITIONS</label>
          {genPoules(Array.from({length: parseInt(nbEquipes)}, (_,i)=>({id:"eq"+i})), parseInt(nbTerrains)).map((p, i) => (
            <button key={i} onClick={() => setPropChoisie(p)} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: propChoisie === p ? "1px solid #3b82f6" : "1px solid #2d3748", cursor: "pointer", textAlign: "left", marginBottom: 8, background: propChoisie === p ? "#3b82f622" : "#0f1420" }}>
              <div style={{ fontWeight: 800, color: propChoisie === p ? "#3b82f6" : "#e2e8f0", fontSize: 14 }}>{p.label}</div>
              <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{p.terrainsNeeded} terrain{p.terrainsNeeded > 1 ? "s" : ""} utilisé{p.terrainsNeeded > 1 ? "s" : ""}</div>
            </button>
          ))}
          {genPoules(Array.from({length: parseInt(nbEquipes)}, (_,i)=>({id:"eq"+i})), parseInt(nbTerrains)).length === 0 && (
            <p style={{ color: "#ef4444", fontSize: 13 }}>Impossible avec ces paramètres. Ajustez le nombre d'équipes ou de terrains.</p>
          )}
        </div>
      )}

      {/* Score parlant */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 14 }}>Score parlant</div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>Reporter automatiquement en notation</div>
          </div>
          <button onClick={() => setScoreParlant(s => ({ ...s, actif: !s.actif }))} style={{ width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer", background: scoreParlant.actif ? "#22c55e" : "#374151", position: "relative", transition: "all .2s" }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", position: "absolute", top: 3, left: scoreParlant.actif ? 21 : 3, transition: "left .2s" }} />
          </button>
        </div>
        {scoreParlant.actif && (
          <div style={{ marginTop: 12 }}>
            {/* Testeur de score parlant */}
            <label style={S.label}>TESTER UN SCORE</label>
            <ScoreParlantTesteur />

            {apsa && (
              <>
                <label style={{ ...S.label, marginTop: 12 }}>COMPÉTENCE À ALIMENTER</label>
                {apsa.competences.filter(cp => cp.notation === "standard").map(cp => (
                  <button key={cp.id} onClick={() => setScoreParlant(s => ({ ...s, compId: cp.id }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left", fontWeight: 700, fontSize: 13, marginBottom: 6, background: scoreParlant.compId === cp.id ? "#22c55e22" : "#0f1420", color: scoreParlant.compId === cp.id ? "#22c55e" : "#9ca3af", border: scoreParlant.compId === cp.id ? "1px solid #22c55e44" : "1px solid #1a2235" }}>{cp.nom}</button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ height: 90 }} />
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "12px 16px 24px", background: "linear-gradient(transparent, #0f1420 40%)", zIndex: 50 }}>
        <button onClick={lancerRencontres} disabled={!classeId || !apsaId || !format || !nbEquipes || !nbTerrains || (format === "poules" && !propChoisie)} style={{ width: "100%", padding: "16px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 15, background: classeId && apsaId && format && nbEquipes && nbTerrains && (format !== "poules" || propChoisie) ? "#3b82f6" : "#374151", color: "#fff" }}>
          🏁 Générer le calendrier
        </button>
      </div>
    </div>
  );

  // ── ÉTAPE MATCH ─────────────────────────────────────────────────────────────
  if (etape === "match") return (
    <div style={S.page}>
      <button onClick={() => setEtape("params")} style={S.backBtn}>← Paramètres</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 16px" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>
          {format === "poules" ? "🏆 Poules" : format === "championnat" ? "⚔️ Championnat" : "🔀 Ronde suisse"}
        </h1>
        <button onClick={() => setEtape("cloture")} style={{ ...S.btn("#ef4444", true), fontSize: 12, padding: "6px 12px" }}>Clôturer</button>
      </div>

      {/* Classement compact */}
      {Object.keys(scores).length > 0 && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>CLASSEMENT</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {classementTrié.map((eq, i) => (
              <div key={eq.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: eq.couleur + "22", border: "1px solid " + eq.couleur + "44" }}>
                <span style={{ fontWeight: 900, color: eq.couleur, fontSize: 13 }}>{i + 1}.</span>
                <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 12 }}>{eq.nom}</span>
                <span style={{ fontWeight: 800, color: eq.couleur, fontSize: 13 }}>{scores[eq.id] ?? 0}pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation rondes — championnat et suisse */}
      {format !== "poules" && rondes.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
          {rondes.map((r, i) => (
            <button key={i} onClick={() => setRondeActive(i)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", background: rondeActive === i ? "#3b82f6" : "#1a2235", color: rondeActive === i ? "#fff" : "#6b7280" }}>
              Ronde {r.num}
            </button>
          ))}
        </div>
      )}

      {/* POULES : affichage par poule avec tous les matchs */}
      {format === "poules" && (() => {
        const numPoules = [...new Set(rondes.map(r => r.poule))].sort((a,b) => a-b);
        return numPoules.map(numPoule => {
          const matchsPoule = rondes.filter(r => r.poule === numPoule).flatMap(r => r.matchs);
          const jouesPoule = matchsPoule.filter(m => m.scoreA !== null).length;
          return (
            <div key={numPoule} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#9ca3af", letterSpacing: 1 }}>POULE {numPoule}</div>
                <div style={{ fontSize: 12, color: jouesPoule === matchsPoule.length ? "#22c55e" : "#6b7280" }}>{jouesPoule}/{matchsPoule.length} matchs</div>
              </div>
              {matchsPoule.map(m => {
                const joue = m.scoreA !== null;
                const nA = joue ? lireMaitrise(m.scoreA, scoreParlant) : null;
                const nB = joue ? lireMaitrise(m.scoreB, scoreParlant) : null;
                return (
                  <div key={m.id} style={{ ...S.card, marginBottom: 8, border: joue ? "1px solid #22c55e33" : "1px solid #2d3748" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: joue || matchEnCours === m.id ? 8 : 0 }}>
                      <div style={{ flex: 1, fontWeight: 800, fontSize: 14, color: m.equipeA.couleur }}>{m.equipeA.nom}</div>
                      {joue
                        ? <div style={{ fontWeight: 900, fontSize: 18, color: "#f1f5f9", minWidth: 80, textAlign: "center" }}>{m.scoreA} — {m.scoreB}</div>
                        : <div style={{ fontSize: 13, color: "#6b7280", minWidth: 30, textAlign: "center" }}>vs</div>}
                      <div style={{ flex: 1, fontWeight: 800, fontSize: 14, color: m.equipeB.couleur, textAlign: "right" }}>{m.equipeB.nom}</div>
                    </div>
                    {(nA || nB) && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        {nA && <span style={{ fontSize: 11, background: getNiveauColor(nA) + "22", color: getNiveauColor(nA), padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>Niv.{nA}</span>}
                        {nB && <span style={{ fontSize: 11, background: getNiveauColor(nB) + "22", color: getNiveauColor(nB), padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>Niv.{nB}</span>}
                      </div>
                    )}
                    {!joue && matchEnCours === m.id ? (
                      <div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                          <div style={{ flex: 1, textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: m.equipeA.couleur, fontWeight: 700, marginBottom: 4 }}>{m.equipeA.nom}</div>
                            <input style={{ ...S.input, textAlign: "center", fontSize: 22, fontWeight: 900 }} type="text" inputMode="numeric" placeholder="ex. 0851" value={scoreInput.a} onChange={e => setScoreInput(s => ({ ...s, a: e.target.value }))} autoFocus />
                          </div>
                          <div style={{ fontSize: 18, color: "#374151", fontWeight: 900 }}>—</div>
                          <div style={{ flex: 1, textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: m.equipeB.couleur, fontWeight: 700, marginBottom: 4 }}>{m.equipeB.nom}</div>
                            <input style={{ ...S.input, textAlign: "center", fontSize: 22, fontWeight: 900 }} type="text" inputMode="numeric" placeholder="ex. 0851" value={scoreInput.b} onChange={e => setScoreInput(s => ({ ...s, b: e.target.value }))} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => { setMatchEnCours(null); setScoreInput({ a: "", b: "" }); }} style={{ ...S.btn("#6b7280", true), flex: 1 }}>Annuler</button>
                          <button onClick={() => validerScore(m.id)} style={{ ...S.btn(), flex: 1 }}>✓ Valider</button>
                        </div>
                      </div>
                    ) : !joue ? (
                      <button onClick={() => { setMatchEnCours(m.id); setScoreInput({ a: "", b: "" }); }} style={{ ...S.btn("#3b82f6", true), width: "100%", fontSize: 13 }}>Saisir le score</button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        });
      })()}

      {/* CHAMPIONNAT et SUISSE : matchs de la ronde active */}
      {format !== "poules" && rondeActuelle?.matchs.map(m => {
        const joue = m.scoreA !== null;
        const nA = joue ? lireMaitrise(m.scoreA, scoreParlant) : null;
        const nB = joue ? lireMaitrise(m.scoreB, scoreParlant) : null;
        return (
          <div key={m.id} style={{ ...S.card, marginBottom: 10, border: joue ? "1px solid #22c55e33" : "1px solid #2d3748" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, fontWeight: 800, fontSize: 15, color: m.equipeA.couleur }}>{m.equipeA.nom}</div>
              {joue
                ? <div style={{ fontWeight: 900, fontSize: 20, color: "#f1f5f9", minWidth: 80, textAlign: "center" }}>{m.scoreA} — {m.scoreB}</div>
                : <div style={{ fontSize: 13, color: "#6b7280", minWidth: 30, textAlign: "center" }}>vs</div>}
              <div style={{ flex: 1, fontWeight: 800, fontSize: 15, color: m.equipeB.couleur, textAlign: "right" }}>{m.equipeB.nom}</div>
            </div>
            {(nA || nB) && (
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {nA && <span style={{ fontSize: 11, background: getNiveauColor(nA) + "22", color: getNiveauColor(nA), padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>Niv.{nA}</span>}
                {nB && <span style={{ fontSize: 11, background: getNiveauColor(nB) + "22", color: getNiveauColor(nB), padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>Niv.{nB}</span>}
              </div>
            )}
            {!joue && matchEnCours === m.id ? (
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: m.equipeA.couleur, fontWeight: 700, marginBottom: 4 }}>{m.equipeA.nom}</div>
                    <input style={{ ...S.input, textAlign: "center", fontSize: 22, fontWeight: 900 }} type="text" inputMode="numeric" placeholder="ex. 0851" value={scoreInput.a} onChange={e => setScoreInput(s => ({ ...s, a: e.target.value }))} autoFocus />
                  </div>
                  <div style={{ fontSize: 18, color: "#374151", fontWeight: 900 }}>—</div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: m.equipeB.couleur, fontWeight: 700, marginBottom: 4 }}>{m.equipeB.nom}</div>
                    <input style={{ ...S.input, textAlign: "center", fontSize: 22, fontWeight: 900 }} type="text" inputMode="numeric" placeholder="ex. 0851" value={scoreInput.b} onChange={e => setScoreInput(s => ({ ...s, b: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setMatchEnCours(null); setScoreInput({ a: "", b: "" }); }} style={{ ...S.btn("#6b7280", true), flex: 1 }}>Annuler</button>
                  <button onClick={() => validerScore(m.id)} style={{ ...S.btn(), flex: 1 }}>✓ Valider</button>
                </div>
              </div>
            ) : !joue ? (
              <button onClick={() => { setMatchEnCours(m.id); setScoreInput({ a: "", b: "" }); }} style={{ ...S.btn("#3b82f6", true), width: "100%", fontSize: 13 }}>Saisir le score</button>
            ) : null}
          </div>
        );
      })}

      {/* Actions selon format */}
      <div style={{ marginTop: 8 }}>
        {format === "suisse" && tousMachtsJoués && (
          <button onClick={ajouterRondeSuisse} style={{ ...S.btn("#8b5cf6"), width: "100%", marginBottom: 10 }}>
            + Ronde suivante
          </button>
        )}
        {format === "poules" && tousMachtsJoués && (
          <div style={{ ...S.card, marginBottom: 10 }}>
            <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>Phase finale — ajouter un match :</div>
            <button onClick={ajouterMatchCustom} style={{ ...S.btn("#f59e0b", true), width: "100%", fontSize: 13 }}>+ Ajouter un match (finale...)</button>
          </div>
        )}
      </div>

      {/* Matchs custom (finales) */}
      {matchsCustom.map((m, i) => (
        <div key={m.id} style={{ ...S.card, marginBottom: 8, border: "1px solid #f59e0b44" }}>
          <div style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>MATCH LIBRE {i + 1}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input style={{ ...S.input, flex: 1 }} placeholder="Équipe A" value={m.nomA} onChange={e => setMatchsCustom(ms => ms.map((x, j) => j === i ? { ...x, nomA: e.target.value } : x))} />
            <input style={{ ...S.input, flex: 1 }} placeholder="Équipe B" value={m.nomB} onChange={e => setMatchsCustom(ms => ms.map((x, j) => j === i ? { ...x, nomB: e.target.value } : x))} />
          </div>
          {m.scoreA === null ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...S.input, flex: 1, textAlign: "center" }} type="number" placeholder="Score A" onChange={e => setMatchsCustom(ms => ms.map((x, j) => j === i ? { ...x, _tmpA: e.target.value } : x))} />
              <input style={{ ...S.input, flex: 1, textAlign: "center" }} type="number" placeholder="Score B" onChange={e => setMatchsCustom(ms => ms.map((x, j) => j === i ? { ...x, _tmpB: e.target.value } : x))} />
              <button onClick={() => setMatchsCustom(ms => ms.map((x, j) => j === i ? { ...x, scoreA: parseFloat(x._tmpA), scoreB: parseFloat(x._tmpB) } : x))} style={{ ...S.btn(), padding: "10px 14px" }}>✓</button>
            </div>
          ) : (
            <div style={{ fontWeight: 900, fontSize: 18, color: "#f1f5f9", textAlign: "center" }}>{m.scoreA} — {m.scoreB}</div>
          )}
        </div>
      ))}

      <div style={{ height: 20 }} />
    </div>
  );

  // ── ÉTAPE CLÔTURE ───────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <button onClick={() => setEtape("match")} style={S.backBtn}>← Rencontres</button>
      <h1 style={{ margin: "8px 0 20px", fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>Clôturer la séance</h1>

      <div style={S.card}>
        <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>RÉSUMÉ</div>
        <div style={{ color: "#e2e8f0", fontSize: 14 }}>
          {rondes.flatMap(r => r.matchs).filter(m => m.scoreA !== null).length} match{rondes.flatMap(r => r.matchs).filter(m => m.scoreA !== null).length > 1 ? "s" : ""} joué{rondes.flatMap(r => r.matchs).filter(m => m.scoreA !== null).length > 1 ? "s" : ""} sur {rondes.flatMap(r => r.matchs).length}
        </div>
        {scoreParlant.actif && scoreParlant.compId && (
          <div style={{ color: "#22c55e", fontSize: 13, marginTop: 6 }}>✓ Niveaux de maîtrise reportés en notation</div>
        )}
      </div>

      <div style={{ ...S.card }}>
        <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>CLASSEMENT FINAL</div>
        {classementTrié.map((eq, i) => (
          <div key={eq.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: eq.couleur + "22", color: eq.couleur, fontWeight: 900, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
            <div style={{ flex: 1, fontWeight: 700, color: "#e2e8f0" }}>{eq.nom}</div>
            <div style={{ fontWeight: 800, color: eq.couleur, fontSize: 16 }}>{scores[eq.id] ?? 0} pts</div>
          </div>
        ))}
      </div>

      <div style={{ height: 90 }} />
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "12px 16px 24px", background: "linear-gradient(transparent, #0f1420 40%)", zIndex: 50 }}>
        <button onClick={cloturerSeance} style={{ width: "100%", padding: "16px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 15, background: "#22c55e", color: "#fff" }}>
          ✓ Clôturer {scoreParlant.actif && scoreParlant.compId ? "et reporter en notation" : "la séance"}
        </button>
      </div>
    </div>
  );
}



function SaisieItemsComp({ data, sel, classe, apsa, comp, gymSelEleve, setGymSelEleve, toggleItem }) {
const selectedEleve = gymSelEleve ?? classe?.eleves[0]?.id ?? null;
const e = classe?.eleves.find(x => x.id === selectedEleve);
if (!comp?.familles || !e) return null;
const score = gymScore(data, sel.classeId, sel.apsaId, e.id, comp);
const niv = gymNiveau(score, comp.seuils);
  return (
    <div style={S.page}>
      <button onClick={() => setNav("apsa")} style={S.backBtn}>← {apsa?.nom}</button>
      <h1 style={{ margin: "6px 0 4px", fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>{comp.nom}</h1>
      <div style={{ marginBottom: 16 }}><Badge label="Par items · capitalisation" color="#ec4899" /><span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>Plafond : {comp.plafond} pts</span></div>
      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>ÉLÈVE</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {classe?.eleves.map(el => (
            <button key={el.id} onClick={() => setGymSelEleve(el.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: selectedEleve === el.id ? "#3b82f6" : "#1a2235", color: selectedEleve === el.id ? "#fff" : "#9ca3af" }}>{el.prenom}</button>
          ))}
        </div>
      </div>
      <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 16, marginBottom: 14, border: `1px solid ${niv ? niv.color + "44" : "#2d3748"}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700 }}>SCORE</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 30, fontWeight: 900, color: niv?.color ?? "#6b7280" }}>{score.toFixed(1)}</span>
            <span style={{ fontSize: 13, color: "#6b7280" }}>/ {comp.plafond} pts</span>
          </div>
          <ProgressBar value={score} max={comp.plafond} color={niv?.color ?? "#374151"} />
        </div>
        {niv && <div style={{ textAlign: "center", padding: "8px 12px", borderRadius: 10, background: niv.color + "22", border: `1px solid ${niv.color}44` }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: niv.color }}>{niv.niveau}</div>
          <div style={{ fontSize: 10, color: niv.color, maxWidth: 70, lineHeight: 1.2 }}>{NIVEAUX.find(n => n.v === niv.niveau)?.desc}</div>
        </div>}
      </div>
      {comp.familles.map(fam => {
        const niv1 = fam.figures.find(f => f.niveau === 1);
        const niv1done = data.evalItems?.[sel.classeId]?.[sel.apsaId]?.[e.id]?.[niv1.id]?.valide ?? false;
        return (
          <div key={fam.id} style={{ ...S.card, marginBottom: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#e2e8f0", marginBottom: 10 }}>{fam.nom}</div>
            {fam.figures.map(fig => {
              const locked = fig.niveau > 1 && !niv1done;
              const checked = locked ? false : (data.evalItems?.[sel.classeId]?.[sel.apsaId]?.[e.id]?.[fig.id]?.valide ?? false);
              return (
                <div key={fig.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, opacity: locked ? 0.35 : 1 }}>
                  <button onClick={() => !locked && toggleItem(sel.classeId, sel.apsaId, e.id, fig.id, !checked)} style={{ width: 28, height: 28, borderRadius: 6, border: `2px solid ${checked ? "#22c55e" : "#374151"}`, background: checked ? "#22c55e22" : "transparent", cursor: locked ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: checked ? "#22c55e" : "#374151", transition: "all .15s" }}>{checked ? "✓" : ""}</button>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, color: checked ? "#e2e8f0" : "#9ca3af", fontWeight: checked ? 700 : 400 }}>{fig.nom}</span>
                    {locked && <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 6 }}>🔒</span>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: fig.niveau === 1 ? "#22c55e" : "#6b7280" }}>+{fig.points}pt</div>
                </div>
              );
            })}
          </div>
        );
      })}
      <div style={S.card}>
        <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>SEUILS DE MAÎTRISE</div>
        {comp.seuils.map(s => (
          <div key={s.niveau} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, opacity: score >= s.min ? 1 : 0.4 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: score >= s.min ? getNiveauColor(s.niveau) : "#374151" }} />
            <div style={{ fontSize: 12, color: score >= s.min ? getNiveauColor(s.niveau) : "#6b7280", flex: 1 }}>{NIVEAUX.find(n => n.v === s.niveau)?.desc}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{s.min} – {s.max} pts</div>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [module, setModule] = useState("home");
  const [nav, setNav] = useState("classes");
  const [sel, setSel] = useState({ classeId: null, apsaId: null, compId: null, eleveId: null });
  const [saisieMode, setSaisieMode] = useState("competence");
  const [gymSelEleve, setGymSelEleve] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const classe = data.classes.find(c => c.id === sel.classeId);
  const apsa = data.apsas.find(a => a.id === sel.apsaId);
  const comp = apsa?.competences.find(c => c.id === sel.compId);
  const eleve = classe?.eleves.find(e => e.id === sel.eleveId);

  // ── Mutations évaluations ─────────────────────────────────────────────────
  const addEval = useCallback((classeId, apsaId, compId, eleveId, niveau) => {
    setData(d => {
      const prev = d.evaluations?.[classeId]?.[apsaId]?.[compId]?.[eleveId] ?? [];
      return {
        ...d,
        evaluations: {
          ...d.evaluations,
          [classeId]: { ...d.evaluations?.[classeId],
            [apsaId]: { ...d.evaluations?.[classeId]?.[apsaId],
              [compId]: { ...d.evaluations?.[classeId]?.[apsaId]?.[compId],
                [eleveId]: [...prev, { id: uid(), niveau, date: today() }]
              }
            }
          }
        }
      };
    });
  }, []);

  const replaceLastEval = useCallback((classeId, apsaId, compId, eleveId, niveau) => {
    setData(d => {
      const prev = d.evaluations?.[classeId]?.[apsaId]?.[compId]?.[eleveId] ?? [];
      if (!prev.length) return d;
      const updated = [...prev.slice(0, -1), { ...prev[prev.length - 1], niveau }];
      return {
        ...d,
        evaluations: {
          ...d.evaluations,
          [classeId]: { ...d.evaluations?.[classeId],
            [apsaId]: { ...d.evaluations?.[classeId]?.[apsaId],
              [compId]: { ...d.evaluations?.[classeId]?.[apsaId]?.[compId],
                [eleveId]: updated
              }
            }
          }
        }
      };
    });
  }, []);

  const toggleItem = useCallback((classeId, apsaId, eleveId, figId, val) => {
    setData(d => ({
      ...d,
      evalItems: {
        ...d.evalItems,
        [classeId]: { ...d.evalItems?.[classeId],
          [apsaId]: { ...d.evalItems?.[classeId]?.[apsaId],
            [eleveId]: { ...d.evalItems?.[classeId]?.[apsaId]?.[eleveId],
              [figId]: { valide: val, date: today() }
            }
          }
        }
      }
    }));
  }, []);

  // ── Gestion classes / élèves / APSA / compétences ─────────────────────────
  function addClasse() {
    if (!form.nom?.trim()) return;
    setData(d => ({ ...d, classes: [...d.classes, { id: uid(), nom: form.nom.trim(), eleves: [] }] }));
    setModal(null); setForm({});
  }
  function deleteClasse(id) { setData(d => ({ ...d, classes: d.classes.filter(c => c.id !== id) })); }

  function addEleve() {
    if (!form.prenom?.trim() || !form.nom?.trim()) return;
    setData(d => ({ ...d, classes: d.classes.map(c => c.id === sel.classeId ? { ...c, eleves: [...c.eleves, { id: uid(), prenom: form.prenom.trim(), nom: form.nom.trim() }] } : c) }));
    setModal(null); setForm({});
  }
  function deleteEleve(id) { setData(d => ({ ...d, classes: d.classes.map(c => c.id === sel.classeId ? { ...c, eleves: c.eleves.filter(e => e.id !== id) } : c) })); }

  function addApsa() {
    if (!form.nom?.trim() || !form.champ) return;
    setData(d => ({ ...d, apsas: [...d.apsas, { id: uid(), nom: form.nom.trim(), champ: form.champ, competences: [] }] }));
    setModal(null); setForm({});
  }
  function deleteApsa(id) { setData(d => ({ ...d, apsas: d.apsas.filter(a => a.id !== id) })); }

  function addComp() {
    if (!form.nom?.trim()) return;
    const nc = {
      id: uid(), nom: form.nom.trim(),
      type: form.type ?? "specifique",
      notation: "standard",
      calcul: form.calcul ?? "moyenne",
      coeff: parseFloat(form.coeff ?? 1),
      modeEval: form.modeEval ?? "individuel",
    };
    if (form.calcul === "validation") nc.seuil = parseInt(form.seuil ?? 3);
    setData(d => ({ ...d, apsas: d.apsas.map(a => a.id === sel.apsaId ? { ...a, competences: [...a.competences, nc] } : a) }));
    setModal(null); setForm({});
  }
  function deleteComp(id) { setData(d => ({ ...d, apsas: d.apsas.map(a => a.id === sel.apsaId ? { ...a, competences: a.competences.filter(c => c.id !== id) } : a) })); }

  // ── Écrans ────────────────────────────────────────────────────────────────
  function HomeScreen() {
    return (
      <div style={{ minHeight: "100vh", background: "#0f1420", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏃</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>EPS Éval</h1>
          <p style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>{data.anneeScolaire}</p>
        </div>
        <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 14 }}>
          <button onClick={() => { setModule("notation"); setNav("classes"); }} style={{ background: "linear-gradient(135deg,#1e3a5f,#1d4ed8)", border: "1px solid #2563eb44", borderRadius: 16, padding: "22px 20px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div style={{ fontWeight: 900, fontSize: 20, color: "#f1f5f9" }}>Notation</div>
            <div style={{ color: "#93c5fd", fontSize: 13, marginTop: 4 }}>Évaluation par compétences</div>
          </button>
          <button onClick={() => setModule("organisation")} style={{ background: "linear-gradient(135deg,#1a2e1a,#15803d)", border: "1px solid #16a34a44", borderRadius: 16, padding: "22px 20px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🏅</div>
            <div style={{ fontWeight: 900, fontSize: 20, color: "#f1f5f9" }}>Organisation</div>
            <div style={{ color: "#86efac", fontSize: 13, marginTop: 4 }}>Rencontres et classements</div>
          </button>
        </div>
      </div>
    );
  }

  function ClassesScreen() {
    return (
      <div style={S.page}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <button onClick={() => setModule("home")} style={S.backBtn}>← Accueil</button>
            <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 900, color: "#f1f5f9" }}>Mes Classes</h1>
          </div>
          <button onClick={() => { setModal("addClasse"); setForm({}); }} style={S.btn()}>+ Classe</button>
        </div>
        {data.classes.map(c => (
          <div key={c.id} style={{ ...S.card, display: "flex", alignItems: "center" }}>
            <button onClick={() => { setSel(s => ({ ...s, classeId: c.id })); setNav("classeDetail"); }} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#f1f5f9" }}>{c.nom}</div>
              <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>{c.eleves.length} élève{c.eleves.length > 1 ? "s" : ""}</div>
            </button>
            <button onClick={() => deleteClasse(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 18, padding: 4 }}>🗑</button>
          </div>
        ))}
        {modal === "addClasse" && (
          <Modal title="Nouvelle classe" onClose={() => setModal(null)}>
            <label style={S.label}>NOM DE LA CLASSE</label>
            <input style={S.input} placeholder="ex. 3ème A" value={form.nom ?? ""} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} autoFocus />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setModal(null)} style={{ ...S.btn("#6b7280", true), flex: 1 }}>Annuler</button>
              <button onClick={addClasse} style={{ ...S.btn(), flex: 1 }}>Créer</button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  function ClasseDetailScreen() {
    const [tab, setTab] = useState("eleves");
    const [apsaPicker, setApsaPicker] = useState(null);

    function ouvrirProfil(eleveId) {
      if (data.apsas.length === 1) {
        setSel(s => ({ ...s, apsaId: data.apsas[0].id, eleveId }));
        setNav("profil");
      } else {
        setApsaPicker(eleveId);
      }
    }

    return (
      <div style={S.page}>
        <button onClick={() => setNav("classes")} style={S.backBtn}>← Classes</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 16px" }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#f1f5f9" }}>{classe?.nom}</h1>
          <button onClick={() => { setModal(tab === "eleves" ? "addEleve" : null); setForm({}); }} style={S.btn()}>
            {tab === "eleves" ? "+ Eleve" : ""}
          </button>
        </div>
        <Tabs options={[["eleves", "Eleves"], ["apsas", "APSA"]]} value={tab} onChange={setTab} />

        {apsaPicker && (
          <Modal title="Choisir une APSA" onClose={() => setApsaPicker(null)}>
            <p style={{ color: "#6b7280", fontSize: 13, marginTop: 0, marginBottom: 16 }}>Voir le profil dans quelle APSA ?</p>
            {data.apsas.map(a => (
              <button key={a.id} onClick={() => {
                setSel(s => ({ ...s, apsaId: a.id, eleveId: apsaPicker }));
                setApsaPicker(null);
                setNav("profil");
              }} style={{ ...S.card, marginBottom: 8, width: "100%", cursor: "pointer", border: "1px solid #2d3748", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 22 }}>{CHAMP_ICONS[a.champ]}</div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#e2e8f0" }}>{a.nom}</div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>{CHAMPS[a.champ]}</div>
                </div>
                <div style={{ color: "#4b5563", fontSize: 18 }}>›</div>
              </button>
            ))}
          </Modal>
        )}

        {tab === "eleves" && classe?.eleves.map(e => (
          <div key={e.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => ouvrirProfil(e.id)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#3b82f622", border: "1px solid #3b82f644", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#3b82f6", flexShrink: 0 }}>{e.prenom[0]}{e.nom[0]}</div>
              <div style={{ flex: 1, color: "#e2e8f0", fontWeight: 600, textAlign: "left" }}>{e.prenom} {e.nom}</div>
              <div style={{ color: "#4b5563", fontSize: 18 }}>›</div>
            </button>
            <button onClick={() => deleteEleve(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16, paddingLeft: 8 }}>🗑</button>
          </div>
        ))}
        {tab === "apsas" && data.apsas.map(a => (
          <button key={a.id} onClick={() => { setSel(s => ({ ...s, apsaId: a.id, compId: null, eleveId: null })); setNav("apsa"); }} style={{ ...S.card, width: "100%", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 24 }}>{CHAMP_ICONS[a.champ]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#e2e8f0" }}>{a.nom}</div>
              <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{CHAMPS[a.champ]}</div>
            </div>
            <div style={{ color: "#4b5563", fontSize: 20 }}>›</div>
          </button>
        ))}
        {modal === "addEleve" && (
          <Modal title="Ajouter un élève" onClose={() => setModal(null)}>
            <label style={S.label}>PRÉNOM</label>
            <input style={{ ...S.input, marginBottom: 10 }} placeholder="Prénom" value={form.prenom ?? ""} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} autoFocus />
            <label style={S.label}>NOM</label>
            <input style={S.input} placeholder="Nom" value={form.nom ?? ""} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setModal(null)} style={{ ...S.btn("#6b7280", true), flex: 1 }}>Annuler</button>
              <button onClick={addEleve} style={{ ...S.btn(), flex: 1 }}>Ajouter</button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  function ApsaScreen() {
    return (
      <div style={S.page}>
        <button onClick={() => setNav("classeDetail")} style={S.backBtn}>← {classe?.nom}</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 4px" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#f1f5f9" }}>{apsa?.nom}</h1>
          <button onClick={() => { setModal("addComp"); setForm({ calcul: "moyenne", type: "specifique", coeff: "1" }); }} style={S.btn()}>+ Comp.</button>
        </div>
        <div style={{ marginBottom: 20 }}><Badge label={apsa?.champ ?? ""} color="#3b82f6" /></div>
        <Tabs options={[["competence", "Par compétence"], ["eleve", "Par élève"]]} value={saisieMode} onChange={setSaisieMode} />
        {apsa?.competences.some(cp => cp.modeEval === "collectif" || cp.modeEval === "collectif_ajust") && (
          <button onClick={() => setNav("prestation")} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 14, background: "linear-gradient(135deg,#0ea5e9,#6366f1)", color: "#fff", marginBottom: 16 }}>
            👥 Prestation collective
          </button>
        )}
        {saisieMode === "competence" && apsa?.competences.map(cp => {
          const vals = classe?.eleves.map(e => getNoteFinale(data, sel.classeId, sel.apsaId, cp, e.id).niveau).filter(v => v > 0) ?? [];
          const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
          const pending = (classe?.eleves.length ?? 0) - vals.length;
          return (
            <div key={cp.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <button onClick={() => { setSel(s => ({ ...s, compId: cp.id })); setNav("saisie"); }} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#e2e8f0" }}>{cp.nom}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    <Badge label={CALCUL_LABELS[cp.calcul]} color={CALCUL_COLORS[cp.calcul]} />
                    {cp.coeff > 1 && <Badge label={"×" + cp.coeff} color="#6b7280" />}
                    {cp.type === "transversale" && <Badge label="transversale" color="#a78bfa" />}
                    {cp.modeEval === "collectif" && <Badge label="👥 Collectif" color="#0ea5e9" />}
                    {cp.modeEval === "collectif_ajust" && <Badge label="👥✏️ Collectif+ajust" color="#0ea5e9" />}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>Moy. <strong style={{ color: "#f1f5f9" }}>{avg}</strong></span>
                    {pending > 0 && <span style={{ fontSize: 12, color: "#ef4444" }}>⚠ {pending} à observer</span>}
                  </div>
                </button>
                <button onClick={() => deleteComp(cp.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16, padding: 4 }}>🗑</button>
              </div>
            </div>
          );
        })}
        {saisieMode === "eleve" && classe?.eleves.map(e => (
          <button key={e.id} onClick={() => { setSel(s => ({ ...s, eleveId: e.id })); setNav("profil"); }} style={{ ...S.card, width: "100%", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#3b82f622", border: "1px solid #3b82f644", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#3b82f6", flexShrink: 0 }}>{e.prenom[0]}{e.nom[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#e2e8f0" }}>{e.prenom} {e.nom}</div>
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                {apsa?.competences.map(cp => {
                  const r = getNoteFinale(data, sel.classeId, sel.apsaId, cp, e.id);
                  return <div key={cp.id} style={{ width: 22, height: 22, borderRadius: 4, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", background: getNiveauColor(r.niveau) + "33", color: getNiveauColor(r.niveau), border: `1px solid ${getNiveauColor(r.niveau)}55` }}>{r.niveau || "—"}</div>;
                })}
              </div>
            </div>
            <div style={{ color: "#4b5563", fontSize: 20 }}>›</div>
          </button>
        ))}
        {modal === "addComp" && (
          <Modal title="Nouvelle compétence" onClose={() => setModal(null)}>
            <label style={S.label}>NOM</label>
            <input style={{ ...S.input, marginBottom: 12 }} placeholder="ex. Maîtrise technique" value={form.nom ?? ""} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} autoFocus />
            <label style={S.label}>TYPE</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[["specifique", "Spécifique"], ["transversale", "Transversale"]].map(([v, l]) => (
                <button key={v} onClick={() => setForm(f => ({ ...f, type: v }))} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: (form.type ?? "specifique") === v ? "#3b82f6" : "#1a2235", color: (form.type ?? "specifique") === v ? "#fff" : "#6b7280" }}>{l}</button>
              ))}
            </div>
            <label style={S.label}>MODE DE CALCUL</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {Object.entries(CALCUL_LABELS).filter(([k]) => k !== "items").map(([v, l]) => (
                <button key={v} onClick={() => setForm(f => ({ ...f, calcul: v, notation: "standard" }))} style={{ padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: (form.calcul ?? "moyenne") === v && form.notation !== "items" ? CALCUL_COLORS[v] : "#1a2235", color: (form.calcul ?? "moyenne") === v && form.notation !== "items" ? "#fff" : "#6b7280" }}>{l}</button>
              ))}
            </div>
            <button onClick={() => { setModal(null); setNav("createItems"); setForm(f => ({ ...f, notation: "items", familles: [], etapeItems: "nom" })); }} style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "1px solid #ec489944", cursor: "pointer", fontWeight: 700, fontSize: 12, background: "#ec489911", color: "#ec4899", marginBottom: 12 }}>
              🎯 Capitalisation par items (gym, escalade...)
            </button>
            {form.calcul === "validation" && (
              <>
                <label style={S.label}>SEUIL</label>
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {[2, 3, 4].map(v => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, seuil: v }))} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 800, background: (form.seuil ?? 3) === v ? getNiveauColor(v) : "#1a2235", color: (form.seuil ?? 3) === v ? "#fff" : getNiveauColor(v) }}>{v}</button>
                  ))}
                </div>
              </>
            )}
            <label style={S.label}>COEFFICIENT</label>
            <input style={{ ...S.input, marginBottom: 12 }} type="number" min="0.5" max="5" step="0.5" value={form.coeff ?? "1"} onChange={e => setForm(f => ({ ...f, coeff: e.target.value }))} />
            <label style={S.label}>MODE D'ÉVALUATION</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {[["individuel","👤 Individuelle"],["collectif","👥 Collective"],["collectif_ajust","👥✏️ Collective + ajust."]].map(([v,l]) => (
                <button key={v} onClick={() => setForm(f => ({ ...f, modeEval: v }))} style={{ flex: 1, padding: "8px 6px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: (form.modeEval ?? "individuel") === v ? "#3b82f6" : "#1a2235", color: (form.modeEval ?? "individuel") === v ? "#fff" : "#6b7280", whiteSpace: "nowrap" }}>{l}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setModal(null)} style={{ ...S.btn("#6b7280", true), flex: 1 }}>Annuler</button>
              <button onClick={addComp} style={{ ...S.btn(), flex: 1 }}>Ajouter</button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ── Saisie standard — composant externe SaisieScreenComp
  function SaisieScreen() {
    if (!comp) return null;
    if (comp.notation === "items") return <SaisieItemsScreen />;
    return <SaisieScreenComp
      key={comp.id}
      data={data} comp={comp} apsa={apsa} classe={classe} sel={sel}
      addEval={addEval} replaceLastEval={replaceLastEval}
      onTerminer={() => setNav("apsa")}
    />;
  }

  // ── Saisie items (gym)
  function SaisieItemsScreen() {
    return <SaisieItemsComp key={comp?.id} data={data} sel={sel} classe={classe} apsa={apsa} comp={comp} gymSelEleve={gymSelEleve} setGymSelEleve={setGymSelEleve} toggleItem={toggleItem} />;
  }

  // ── Profil élève ──────────────────────────────────────────────────────────
  function ProfilScreen() {
    if (!eleve || !apsa) return null;
    return (
      <div style={S.page}>
        <button onClick={() => setNav("apsa")} style={S.backBtn}>← {apsa.nom}</button>
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "8px 0 24px" }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: "#3b82f622", border: "1px solid #3b82f644", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "#3b82f6" }}>{eleve.prenom[0]}{eleve.nom[0]}</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#f1f5f9" }}>{eleve.prenom} {eleve.nom}</h1>
            <div style={{ color: "#6b7280", fontSize: 13 }}>{classe?.nom} · {apsa.nom}</div>
          </div>
        </div>
        {apsa.competences.map(cp => {
          const note = getNoteFinale(data, sel.classeId, sel.apsaId, cp, eleve.id);
          const n = NIVEAUX.find(x => x.v === note.niveau) ?? { color: "#374151", desc: "Non évalué" };
          const evals = cp.notation !== "items" ? getEvals(data, sel.classeId, sel.apsaId, cp.id, eleve.id) : [];
          return (
            <div key={cp.id} style={{ ...S.card, border: `1px solid ${note.niveau > 0 ? n.color + "33" : "#2d3748"}`, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#e2e8f0" }}>{cp.nom}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    <Badge label={CALCUL_LABELS[cp.calcul]} color={CALCUL_COLORS[cp.calcul]} />
                  </div>
                </div>
                <div style={{ minWidth: 52, height: 52, borderRadius: 10, background: n.color + "22", border: `2px solid ${n.color}66`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: n.color }}>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>{note.niveau || "—"}</div>
                  {note.isItems && note.score > 0 && <div style={{ fontSize: 10 }}>{note.score.toFixed(1)}pt</div>}
                </div>
              </div>
              {cp.notation !== "items" ? (
                <>
                  <div style={{ display: "flex", gap: 4, marginBottom: evals.length ? 8 : 0 }}>
                    {NIVEAUX.map(nl => (
                      <NiveauBtn key={nl.v} value={nl.v} current={evals.length ? evals[evals.length - 1].niveau : 0}
                        onChange={val => addEval(sel.classeId, sel.apsaId, cp.id, eleve.id, val)} />
                    ))}
                  </div>
                  {evals.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 4 }}>Historique ({evals.length} éval.)</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {evals.slice(-8).map((ev, i) => (
                          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 6px", borderRadius: 6, background: getNiveauColor(ev.niveau) + "22" }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: getNiveauColor(ev.niveau) }}>{ev.niveau}</span>
                            <span style={{ fontSize: 9, color: "#6b7280" }}>{ev.date.slice(5)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <ProgressBar value={note.score} max={cp.plafond} color={n.color} />
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{note.score?.toFixed(1)} / {cp.plafond} pts</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function OrganisationScreen() {
    return (
      <OrganisationComp
        data={data}
        addEval={addEval}
        onRetour={() => setModule("home")}
      />
    );
  }

  // ── Routing ───────────────────────────────────────────────────────────────
  if (module === "home") return <div style={{ background: "#0f1420", minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}><HomeScreen /></div>;
  if (module === "organisation") return <div style={{ background: "#0f1420", minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}><OrganisationScreen /></div>;

  const crumbs = [
    { id: "classes", label: "Classes" },
    { id: "classeDetail", label: classe?.nom ?? "Classe", disabled: !sel.classeId },
    { id: "apsa", label: apsa?.nom ?? "APSA", disabled: !sel.apsaId },
  ];

  return (
    <div style={{ background: "#0f1420", minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: "#0f1420", borderBottom: "1px solid #1a2235", padding: "10px 16px 0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto" }}>
          <button onClick={() => setModule("home")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "6px 8px 12px", color: "#6b7280" }}>⌂</button>
          {crumbs.map((c, i) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#374151", fontSize: 12 }}>›</span>
              <button onClick={() => !c.disabled && setNav(c.id)} style={{ background: "none", border: "none", cursor: c.disabled ? "default" : "pointer", padding: "6px 6px 12px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", color: nav === c.id ? "#3b82f6" : c.disabled ? "#374151" : "#6b7280", borderBottom: nav === c.id ? "2px solid #3b82f6" : "2px solid transparent" }}>{c.label}</button>
            </div>
          ))}
        </div>
      </div>
      {nav === "classes" && <ClassesScreen />}
      {nav === "classeDetail" && <ClasseDetailScreen />}
      {nav === "apsa" && <ApsaScreen />}
      {nav === "profil" && <ProfilScreen />}
      {nav === "saisie" && comp && comp.notation !== "items" && (
        <SaisieScreenComp
          key={comp.id}
          data={data} comp={comp} apsa={apsa} classe={classe} sel={sel}
          addEval={addEval} replaceLastEval={replaceLastEval}
          onTerminer={() => setNav("apsa")}
        />
      )}
      {nav === "saisie" && comp && comp.notation === "items" && <SaisieItemsScreen />}
      {nav === "prestation" && apsa && classe && (
        <PrestationComp
          key={sel.classeId + "_" + sel.apsaId}
          data={data} apsa={apsa} classe={classe} sel={sel}
          addEval={addEval} replaceLastEval={replaceLastEval}
          toggleItemForEleve={toggleItem}
          onRetour={() => setNav("apsa")}
        />
      )}
      {nav === "createItems" && apsa && (
        <CreateItemsScreen
          key={sel.apsaId}
          apsaId={sel.apsaId}
          onCancel={() => { setNav("apsa"); setModal(null); }}
          onSave={newComp => {
            setData(d => ({ ...d, apsas: d.apsas.map(a => a.id === sel.apsaId ? { ...a, competences: [...a.competences, newComp] } : a) }));
            setNav("apsa");
          }}
        />
      )}
      {!["classes","classeDetail","apsa","saisie","profil","prestation","createItems"].includes(nav) && <ClassesScreen />}
    </div>
  );
}
