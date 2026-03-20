import IconSymbol from "../IconSymbol"

export default function MetricTile({ label, value, detail, icon = "", accent = "", className = "" }) {
  const classes = ["surface", "metric-card", "premium-card", "metric-tile", className].filter(Boolean).join(" ")

  return (
    <article className={classes}>
      <div className="metric-tile-head">
        <p className="eyebrow">{label}</p>
        {icon ? (
          <span className={`metric-tile-icon${accent ? ` ${accent}` : ""}`}>
            <IconSymbol className="icon-sm" name={icon} />
          </span>
        ) : null}
      </div>
      <h2>{value}</h2>
      {detail ? <p>{detail}</p> : null}
    </article>
  )
}
