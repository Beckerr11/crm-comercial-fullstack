import IconSymbol from "./IconSymbol"

const techMap = {
  react: { icon: "react" },
  "react 19": { icon: "react" },
  vite: { icon: "vite" },
  javascript: { icon: "javascript" },
  html: { icon: "html" },
  css: { icon: "css" },
  "node.js": { icon: "nodejs" },
  nodejs: { icon: "nodejs" },
  node: { icon: "nodejs" },
  express: { icon: "express" },
  mongodb: { icon: "mongodb" },
  jwt: { icon: "jwt" },
  "autenticacao jwt": { icon: "jwt" },
  oauth: { icon: "oauth" },
  "socket.io": { icon: "socketio" },
  socketio: { icon: "socketio" },
  git: { icon: "git" },
  github: { icon: "github" },
  linkedin: { icon: "linkedin" },
  instagram: { icon: "instagram" },
  whatsapp: { icon: "whatsapp" },
  vercel: { icon: "vercel" },
  render: { icon: "render" },
  pdf: { icon: "pdf" },
  "apis rest": { icon: "api" },
  "api rest": { icon: "api" },
  "rest api": { icon: "api" },
  "react router": { icon: "dashboard" },
  "css system": { icon: "css" },
  "responsive design": { icon: "responsive" },
  "interfaces responsivas": { icon: "responsive" },
  "ux responsiva": { icon: "responsive" },
  componentizacao: { icon: "components" },
  "ux/ui": { icon: "uxui" },
  crud: { icon: "crud" },
  "modelagem de dados": { icon: "mongodb" },
  "fluxos autenticados": { icon: "approved" },
  "validacao de entrada": { icon: "approved" },
  "tratamento de erros": { icon: "rejected" },
  versionamento: { icon: "git" },
  debugging: { icon: "search" },
  refatoracao: { icon: "sparkle" },
  dashboard: { icon: "dashboard" },
  saas: { icon: "saas" },
  seo: { icon: "seo" },
}

function normalize(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function resolveTechBadge(value) {
  return techMap[normalize(value)] || { icon: "sparkle" }
}

export default function TechBadge({ value, className = "" }) {
  const meta = resolveTechBadge(value)

  return (
    <span className={["mini-pill", "tech-pill", className].filter(Boolean).join(" ")}>
      <IconSymbol className="icon-xs tech-pill-icon" name={meta.icon} />
      <span>{value}</span>
    </span>
  )
}
