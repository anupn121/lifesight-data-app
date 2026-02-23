"use client";

import { useState, useMemo, useEffect } from "react";
import {
  type Field,
  DATA_TYPES,
  getSourceStreamInfo,
} from "./fieldsData";

// ─── Noir theme constants ───
const NOIR = {
  bg: "#0a0a0f",
  text: "#e0e0e8",
  textMuted: "#888",
  textDim: "#555",
  accent: "#8B5CF6",
  accentPink: "#EC4899",
  bgCard: "rgba(139,92,246,0.06)",
  border: "rgba(139,92,246,0.12)",
  bgTarget: "rgba(236,72,153,0.06)",
  borderTarget: "rgba(236,72,153,0.15)",
  font: "'JetBrains Mono', 'Fira Code', monospace",
};

type FlowViewMode = "field" | "source";
type StatusFilter = "all" | "mapped" | "unmapped";

interface FlowViewProps {
  fields: Field[];
  kind: "metric" | "dimension";
  onBulkAdd: () => void;
}

// ─── Field View: many sources → one unified metric/dimension ───
interface FieldGroup {
  displayName: string;
  sources: Field[];
  dataType: string;
  transformation: string;
  description: string;
  hasMapped: boolean;
  hasUnmapped: boolean;
}

// ─── Source View: one source stream → many fields ───
interface SourceGroup {
  key: string;
  parent: string;
  stream: string;
  color: string;
  fields: Field[];
}

export default function FlowView({ fields, kind, onBulkAdd }: FlowViewProps) {
  const [viewMode, setViewMode] = useState<FlowViewMode>("field");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Reset selection when view mode or kind changes
  useEffect(() => {
    setSelectedItem(null);
    setSearch("");
    setStatusFilter("all");
    setSourceFilter("all");
  }, [viewMode, kind]);

  // Filter fields by kind
  const kindFields = useMemo(() => fields.filter((f) => f.kind === kind), [fields, kind]);

  // Unique sources for source filter dropdown
  const uniqueSources = useMemo(() => {
    const s = new Set(kindFields.map((f) => f.source));
    return Array.from(s).sort();
  }, [kindFields]);

  // Apply search/status/source filters
  const filtered = useMemo(() => {
    return kindFields.filter((f) => {
      if (statusFilter === "mapped" && f.status !== "Mapped") return false;
      if (statusFilter === "unmapped" && f.status !== "Unmapped") return false;
      if (sourceFilter !== "all" && f.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          f.displayName.toLowerCase().includes(q) ||
          f.source.toLowerCase().includes(q) ||
          f.sourceKey.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [kindFields, search, statusFilter, sourceFilter]);

  // ─── Field View groups ───
  const fieldGroups = useMemo((): FieldGroup[] => {
    const map = new Map<string, Field[]>();
    for (const f of filtered) {
      const arr = map.get(f.displayName) || [];
      arr.push(f);
      map.set(f.displayName, arr);
    }
    return Array.from(map.entries()).map(([name, sources]) => ({
      displayName: name,
      sources,
      dataType: sources[0].dataType,
      transformation: sources[0].transformation,
      description: sources[0].description,
      hasMapped: sources.some((s) => s.status === "Mapped"),
      hasUnmapped: sources.some((s) => s.status === "Unmapped"),
    }));
  }, [filtered]);

  // ─── Source View groups ───
  const sourceGroups = useMemo((): SourceGroup[] => {
    const map = new Map<string, { parent: string; stream: string; color: string; fields: Field[] }>();
    for (const f of filtered) {
      const info = getSourceStreamInfo(f.source);
      const key = `${info.parent}::${info.stream}`;
      if (!map.has(key)) {
        map.set(key, { parent: info.parent, stream: info.stream, color: info.color, fields: [] });
      }
      map.get(key)!.fields.push(f);
    }
    return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
  }, [filtered]);

  // Auto-select first item if none selected
  useEffect(() => {
    if (viewMode === "field" && fieldGroups.length > 0 && (!selectedItem || !fieldGroups.find((g) => g.displayName === selectedItem))) {
      setSelectedItem(fieldGroups[0].displayName);
    } else if (viewMode === "source" && sourceGroups.length > 0 && (!selectedItem || !sourceGroups.find((g) => g.key === selectedItem))) {
      setSelectedItem(sourceGroups[0].key);
    } else if ((viewMode === "field" && fieldGroups.length === 0) || (viewMode === "source" && sourceGroups.length === 0)) {
      setSelectedItem(null);
    }
  }, [fieldGroups, sourceGroups, viewMode, selectedItem]);

  const kindLabel = kind === "metric" ? "metrics" : "dimensions";
  const kindSingular = kind === "metric" ? "Metric" : "Dimension";

  // Currently selected group
  const selectedFieldGroup = viewMode === "field" ? fieldGroups.find((g) => g.displayName === selectedItem) : null;
  const selectedSourceGroup = viewMode === "source" ? sourceGroups.find((g) => g.key === selectedItem) : null;

  return (
    <div
      style={{
        background: NOIR.bg,
        color: NOIR.text,
        fontFamily: NOIR.font,
        position: "relative",
        overflow: "hidden",
        minHeight: 500,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: `linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Top toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 20px",
          borderBottom: `1px solid ${NOIR.border}`,
          position: "relative",
          zIndex: 1,
          flexWrap: "wrap",
        }}
      >
        {/* View toggle */}
        <div style={{ display: "flex", gap: 2, background: "rgba(139,92,246,0.08)", borderRadius: 8, padding: 2 }}>
          {(["field", "source"] as FlowViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: NOIR.font,
                letterSpacing: 0.5,
                background: viewMode === m ? NOIR.accent : "transparent",
                color: viewMode === m ? "#fff" : NOIR.textMuted,
                transition: "all 0.2s",
              }}
            >
              {m === "field" ? `${kindSingular} View` : "Source View"}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${NOIR.border}`,
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 11,
            color: NOIR.text,
            fontFamily: NOIR.font,
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all" style={{ background: NOIR.bg }}>All Status</option>
          <option value="mapped" style={{ background: NOIR.bg }}>Mapped</option>
          <option value="unmapped" style={{ background: NOIR.bg }}>Unmapped</option>
        </select>

        {/* Source filter */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${NOIR.border}`,
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 11,
            color: NOIR.text,
            fontFamily: NOIR.font,
            outline: "none",
            cursor: "pointer",
            maxWidth: 180,
          }}
        >
          <option value="all" style={{ background: NOIR.bg }}>All Sources</option>
          {uniqueSources.map((s) => (
            <option key={s} value={s} style={{ background: NOIR.bg }}>{s}</option>
          ))}
        </select>

        {/* Bulk Add */}
        <button
          onClick={onBulkAdd}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontSize: 11,
            fontFamily: NOIR.font,
            letterSpacing: 0.5,
            background: NOIR.accent,
            color: "#fff",
            transition: "all 0.2s",
          }}
        >
          + Bulk Add
        </button>

        {/* Count */}
        <span style={{ fontSize: 11, color: NOIR.textDim, marginLeft: "auto" }}>
          {viewMode === "field" ? fieldGroups.length : sourceGroups.length}{" "}
          {viewMode === "field" ? kindLabel : "sources"}
        </span>
      </div>

      {/* Main body: sidebar + flow diagram */}
      <div style={{ display: "flex", flex: 1, position: "relative", zIndex: 1, minHeight: 450 }}>
        {/* ─── Left sidebar: list ─── */}
        <div
          style={{
            width: 240,
            flexShrink: 0,
            borderRight: `1px solid ${NOIR.border}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Sidebar search */}
          <div style={{ padding: "12px 12px 8px" }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${viewMode === "field" ? kindLabel : "sources"}...`}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${NOIR.border}`,
                borderRadius: 6,
                padding: "7px 10px",
                fontSize: 11,
                color: NOIR.text,
                fontFamily: NOIR.font,
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = NOIR.accent)}
              onBlur={(e) => (e.target.style.borderColor = NOIR.border)}
            />
          </div>

          {/* Sidebar list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 0 8px" }}>
            {viewMode === "field" ? (
              fieldGroups.length === 0 ? (
                <div style={{ padding: "24px 12px", textAlign: "center", color: NOIR.textDim, fontSize: 11 }}>
                  No {kindLabel} match filters
                </div>
              ) : (
                fieldGroups.map((g, i) => (
                  <button
                    key={g.displayName}
                    onClick={() => { setSelectedItem(g.displayName); setHoveredNode(null); }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 12px",
                      border: "none",
                      cursor: "pointer",
                      background: selectedItem === g.displayName ? "rgba(139,92,246,0.1)" : "transparent",
                      borderLeft: selectedItem === g.displayName ? "2px solid #8B5CF6" : "2px solid transparent",
                      color: selectedItem === g.displayName ? "#c4b5fd" : NOIR.textMuted,
                      fontSize: 12,
                      fontFamily: NOIR.font,
                      textAlign: "left",
                      letterSpacing: 0.3,
                      transition: "all 0.15s",
                      opacity: mounted ? 1 : 0,
                      transform: mounted ? "translateX(0)" : "translateX(-12px)",
                      transitionDelay: `${i * 20}ms`,
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: 2, flexShrink: 0,
                      background: selectedItem === g.displayName ? NOIR.accent : "#333",
                      transition: "all 0.15s",
                    }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {g.displayName}
                    </span>
                    <span style={{ fontSize: 10, color: NOIR.textDim, flexShrink: 0 }}>
                      {g.sources.length}
                    </span>
                  </button>
                ))
              )
            ) : (
              sourceGroups.length === 0 ? (
                <div style={{ padding: "24px 12px", textAlign: "center", color: NOIR.textDim, fontSize: 11 }}>
                  No sources match filters
                </div>
              ) : (
                sourceGroups.map((g, i) => (
                  <button
                    key={g.key}
                    onClick={() => { setSelectedItem(g.key); setHoveredNode(null); }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 12px",
                      border: "none",
                      cursor: "pointer",
                      background: selectedItem === g.key ? "rgba(139,92,246,0.1)" : "transparent",
                      borderLeft: selectedItem === g.key ? "2px solid #8B5CF6" : "2px solid transparent",
                      color: selectedItem === g.key ? "#c4b5fd" : NOIR.textMuted,
                      fontSize: 12,
                      fontFamily: NOIR.font,
                      textAlign: "left",
                      letterSpacing: 0.3,
                      transition: "all 0.15s",
                      opacity: mounted ? 1 : 0,
                      transform: mounted ? "translateX(0)" : "translateX(-12px)",
                      transitionDelay: `${i * 20}ms`,
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: 2, flexShrink: 0,
                      background: selectedItem === g.key ? g.color : "#333",
                      transition: "all 0.15s",
                    }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                      <span>{g.parent}</span>
                      <span style={{ fontSize: 10, color: NOIR.textDim }}>{g.stream}</span>
                    </span>
                    <span style={{ fontSize: 10, color: NOIR.textDim, flexShrink: 0 }}>
                      {g.fields.length}
                    </span>
                  </button>
                ))
              )
            )}
          </div>
        </div>

        {/* ─── Right: Flow diagram for selected item ─── */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
          {viewMode === "field" && selectedFieldGroup && (
            <FieldFlowDiagram group={selectedFieldGroup} mounted={mounted} hoveredNode={hoveredNode} onHoverNode={setHoveredNode} />
          )}
          {viewMode === "source" && selectedSourceGroup && (
            <SourceFlowDiagram group={selectedSourceGroup} mounted={mounted} hoveredNode={hoveredNode} onHoverNode={setHoveredNode} />
          )}
          {!selectedFieldGroup && !selectedSourceGroup && (
            <div style={{ textAlign: "center", color: NOIR.textDim, fontSize: 13 }}>
              {(viewMode === "field" ? fieldGroups.length : sourceGroups.length) === 0
                ? `No ${kindLabel} flow data matches the current filters`
                : `Select a ${viewMode === "field" ? kindSingular.toLowerCase() : "source"} from the list`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Field Flow Diagram — many sources → one target (centered)
// ═══════════════════════════════════════════════════════════════

function FieldFlowDiagram({
  group,
  mounted,
  hoveredNode,
  onHoverNode,
}: {
  group: FieldGroup;
  mounted: boolean;
  hoveredNode: string | null;
  onHoverNode: (id: string | null) => void;
}) {
  const groupId = group.displayName;
  const nodeH = 48;
  const svgW = 200;
  const svgH = Math.max(100, group.sources.length * nodeH);
  const targetY = svgH / 2;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "scale(1)" : "scale(0.97)",
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* Left: Source nodes */}
      <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {group.sources.map((src, si) => {
          const nodeId = `${groupId}::src::${si}`;
          const isHovered = hoveredNode === nodeId;
          const highlight = isHovered || hoveredNode === `target::${groupId}`;
          return (
            <div
              key={nodeId}
              onMouseEnter={() => onHoverNode(nodeId)}
              onMouseLeave={() => onHoverNode(null)}
              style={{
                background: highlight ? "rgba(139,92,246,0.12)" : NOIR.bgCard,
                border: `1px solid ${highlight ? "rgba(139,92,246,0.35)" : NOIR.border}`,
                borderRadius: 6,
                padding: "8px 12px",
                transition: "all 0.25s",
                cursor: "default",
                boxShadow: isHovered ? "0 0 16px rgba(139,92,246,0.18)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: src.sourceColor, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#c4b5fd", letterSpacing: 0.3, fontWeight: 500 }}>{src.source}</span>
              </div>
              <div style={{ fontSize: 10, color: NOIR.textDim, marginTop: 3, paddingLeft: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {src.sourceKey}
              </div>
            </div>
          );
        })}
      </div>

      {/* Center: SVG bezier paths */}
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ flexShrink: 0 }}>
        <defs>
          {group.sources.map((src, si) => (
            <linearGradient key={si} id={`fg-${groupId.replace(/\s/g, "_")}-${si}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={src.sourceColor} stopOpacity="0.5" />
              <stop offset="100%" stopColor={NOIR.accent} stopOpacity="0.7" />
            </linearGradient>
          ))}
        </defs>
        {group.sources.map((src, si) => {
          const sy = si * nodeH + nodeH / 2;
          const ey = targetY;
          const nodeId = `${groupId}::src::${si}`;
          const isHovered = hoveredNode === nodeId;
          const highlight = isHovered || hoveredNode === `target::${groupId}`;
          return (
            <path
              key={si}
              d={`M 0 ${sy} C 80 ${sy}, 120 ${ey}, ${svgW} ${ey}`}
              fill="none"
              stroke={`url(#fg-${groupId.replace(/\s/g, "_")}-${si})`}
              strokeWidth={highlight ? 2.5 : 1.5}
              opacity={highlight ? 0.85 : 0.3}
              style={{ transition: "all 0.25s" }}
            />
          );
        })}
      </svg>

      {/* Right: Target card */}
      <div
        onMouseEnter={() => onHoverNode(`target::${groupId}`)}
        onMouseLeave={() => onHoverNode(null)}
        style={{
          width: 260,
          flexShrink: 0,
          background: hoveredNode === `target::${groupId}` ? "rgba(236,72,153,0.12)" : NOIR.bgTarget,
          border: `1px solid ${hoveredNode === `target::${groupId}` ? "rgba(236,72,153,0.4)" : NOIR.borderTarget}`,
          borderRadius: 10,
          padding: "16px 20px",
          transition: "all 0.25s",
          boxShadow: hoveredNode === `target::${groupId}` ? "0 0 24px rgba(236,72,153,0.12)" : "none",
          alignSelf: "center",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: NOIR.accentPink, letterSpacing: 0.3 }}>
          {group.displayName}
        </div>
        <div style={{ fontSize: 11, color: NOIR.textMuted, marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(139,92,246,0.08)", border: `1px solid ${NOIR.border}`, fontSize: 10 }}>
            {DATA_TYPES[group.dataType as keyof typeof DATA_TYPES]?.display || group.dataType}
          </span>
          <span style={{ color: NOIR.textDim }}>·</span>
          <span style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(139,92,246,0.08)", border: `1px solid ${NOIR.border}`, fontSize: 10 }}>
            {group.transformation}
          </span>
        </div>
        {group.description && (
          <div style={{ fontSize: 11, color: NOIR.textDim, marginTop: 8, lineHeight: 1.5 }}>
            &ldquo;{group.description}&rdquo;
          </div>
        )}
        <div style={{ fontSize: 10, color: NOIR.textDim, marginTop: 8 }}>
          {group.sources.length} source{group.sources.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Source Flow Diagram — one source → many fields (centered)
// ═══════════════════════════════════════════════════════════════

function SourceFlowDiagram({
  group,
  mounted,
  hoveredNode,
  onHoverNode,
}: {
  group: SourceGroup;
  mounted: boolean;
  hoveredNode: string | null;
  onHoverNode: (id: string | null) => void;
}) {
  const groupId = group.key;
  const nodeH = 48;
  const svgW = 200;
  const svgH = Math.max(100, group.fields.length * nodeH);
  const sourceY = svgH / 2;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "scale(1)" : "scale(0.97)",
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* Left: Source card */}
      <div
        onMouseEnter={() => onHoverNode(`src::${groupId}`)}
        onMouseLeave={() => onHoverNode(null)}
        style={{
          width: 220,
          flexShrink: 0,
          background: hoveredNode === `src::${groupId}` ? "rgba(139,92,246,0.14)" : NOIR.bgCard,
          border: `1px solid ${hoveredNode === `src::${groupId}` ? "rgba(139,92,246,0.35)" : NOIR.border}`,
          borderRadius: 10,
          padding: "16px 20px",
          transition: "all 0.25s",
          boxShadow: hoveredNode === `src::${groupId}` ? "0 0 24px rgba(139,92,246,0.18)" : "none",
          alignSelf: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: group.color, flexShrink: 0 }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#c4b5fd" }}>{group.parent}</span>
        </div>
        <div style={{ fontSize: 12, color: NOIR.textMuted, marginTop: 6, paddingLeft: 18 }}>
          {group.stream}
        </div>
        <div style={{ fontSize: 10, color: NOIR.textDim, marginTop: 6, paddingLeft: 18 }}>
          {group.fields.length} {group.fields.length === 1 ? "field" : "fields"}
        </div>
      </div>

      {/* Center: SVG bezier paths */}
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id={`sg-${groupId.replace(/[:\s]/g, "_")}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={group.color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={NOIR.accentPink} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {group.fields.map((f, fi) => {
          const ey = fi * nodeH + nodeH / 2;
          const sy = sourceY;
          const nodeId = `${groupId}::field::${fi}`;
          const isHovered = hoveredNode === nodeId;
          const highlight = isHovered || hoveredNode === `src::${groupId}`;
          return (
            <path
              key={fi}
              d={`M 0 ${sy} C 80 ${sy}, 120 ${ey}, ${svgW} ${ey}`}
              fill="none"
              stroke={`url(#sg-${groupId.replace(/[:\s]/g, "_")})`}
              strokeWidth={highlight ? 2.5 : 1.5}
              opacity={highlight ? 0.85 : 0.3}
              style={{ transition: "all 0.25s" }}
            />
          );
        })}
      </svg>

      {/* Right: Field target nodes */}
      <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {group.fields.map((f, fi) => {
          const nodeId = `${groupId}::field::${fi}`;
          const isHovered = hoveredNode === nodeId;
          const highlight = isHovered || hoveredNode === `src::${groupId}`;
          return (
            <div
              key={nodeId}
              onMouseEnter={() => onHoverNode(nodeId)}
              onMouseLeave={() => onHoverNode(null)}
              style={{
                background: highlight ? "rgba(236,72,153,0.12)" : NOIR.bgTarget,
                border: `1px solid ${highlight ? "rgba(236,72,153,0.35)" : NOIR.borderTarget}`,
                borderRadius: 6,
                padding: "8px 12px",
                transition: "all 0.25s",
                cursor: "default",
                boxShadow: isHovered ? "0 0 14px rgba(236,72,153,0.14)" : "none",
              }}
            >
              <div style={{ fontSize: 12, color: "#f9a8d4", letterSpacing: 0.3, fontWeight: 500 }}>{f.displayName}</div>
              <div style={{ fontSize: 10, color: NOIR.textDim, marginTop: 3, display: "flex", gap: 6, alignItems: "center" }}>
                <span>{DATA_TYPES[f.dataType as keyof typeof DATA_TYPES]?.display || f.dataType}</span>
                <span style={{ color: "#333" }}>·</span>
                <span>{f.transformation}</span>
              </div>
              <div style={{ fontSize: 10, color: NOIR.textDim, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.sourceKey}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
