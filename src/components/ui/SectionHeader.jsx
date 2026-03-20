export default function SectionHeader({
  eyebrow,
  title,
  description,
  actions = null,
  meta = null,
  className = "",
}) {
  const classes = ["section-heading", "section-title", className].filter(Boolean).join(" ")

  return (
    <div className={classes}>
      <div className="section-heading-copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {title ? <h2>{title}</h2> : null}
        {description ? <p className="section-copy compact">{description}</p> : null}
      </div>

      {meta || actions ? (
        <div className="section-heading-actions">
          {meta}
          {actions}
        </div>
      ) : null}
    </div>
  )
}
