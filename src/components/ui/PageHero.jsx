export default function PageHero({
  eyebrow,
  title,
  description,
  actions = null,
  meta = null,
  aside = null,
  copyFooter = null,
  children = null,
  className = "",
}) {
  const classes = ["surface", "section-card", "page-hero", className].filter(Boolean).join(" ")

  return (
    <section className={classes}>
      <div className={`page-hero-grid${aside ? " has-aside" : ""}`}>
        <div className="page-hero-copy">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {title ? <h1>{title}</h1> : null}
          {description ? <p className="section-copy page-hero-description">{description}</p> : null}
          {meta ? <div className="pill-row page-hero-meta">{meta}</div> : null}
          {actions ? <div className="hero-actions page-hero-actions">{actions}</div> : null}
          {copyFooter}
        </div>

        {aside ? <div className="page-hero-aside">{aside}</div> : null}
      </div>

      {children}
    </section>
  )
}
