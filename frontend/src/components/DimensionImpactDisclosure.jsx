import React from "react";
import { ChevronDown, Layers3 } from "lucide-react";

const RISK_TONES = {
  "Nulo": { color: "#64748b", background: "rgba(100, 116, 139, 0.12)" },
  "Bajo": { color: "#059669", background: "rgba(16, 185, 129, 0.12)" },
  "Medio": { color: "#d97706", background: "rgba(245, 158, 11, 0.14)" },
  "Alto": { color: "#dc2626", background: "rgba(239, 68, 68, 0.12)" },
  "Muy Alto": { color: "#991b1b", background: "rgba(185, 28, 28, 0.14)" },
};

export default function DimensionImpactDisclosure({ dimensions = [], compact = false }) {
  return (
    <details className={`dimension-impact${compact ? " dimension-impact--compact" : ""}`}>
      <summary>
        <span>
          <Layers3 size={15} />
          Dimensiones involucradas
        </span>
        <span className="dimension-impact-count">{dimensions.length}</span>
        <ChevronDown className="dimension-impact-chevron" size={16} />
      </summary>
      <div className="dimension-impact-content">
        {dimensions.length > 0 ? dimensions.map((dimension) => {
          const tone = RISK_TONES[dimension.risk] || RISK_TONES.Nulo;
          return (
            <div className="dimension-impact-row" key={dimension.name}>
              <span className="dimension-impact-name">{dimension.name}</span>
              <span className="dimension-impact-score">{Number(dimension.score).toFixed(2)}</span>
              <span
                className="dimension-impact-risk"
                style={{ color: tone.color, backgroundColor: tone.background }}
              >
                {dimension.risk}
              </span>
            </div>
          );
        }) : (
          <p className="dimension-impact-empty">
            Esta actividad no tiene evidencia dimensional histórica disponible.
          </p>
        )}
      </div>
    </details>
  );
}
