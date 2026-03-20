import {
  aboutHighlights,
  curatedRepositories,
  featuredProjects,
  primaryCase,
  productModules,
  productSignals,
  publicCapabilityBlocks,
  resumeData,
  serviceCatalog,
  showcaseShots,
  socialProofCards,
  stackGroups,
} from "../../data/portfolioContent"

export const landingTrustMarkers = [
  {
    title: "Produto publicado",
    metric: "Frontend + API online",
    description: "A experiência pública e a API ficam no ar para provar fluxo real, não só mock ou imagem estática.",
    icon: "analytics",
  },
  {
    title: "Jornada conectada",
    metric: "Landing -> auth -> CRM",
    description: "A mesma identidade visual continua da vitrine até o workspace autenticado, sem quebrar a narrativa do produto.",
    icon: "dashboard",
  },
  {
    title: "Fluxo comercial ativo",
    metric: "PDF + WhatsApp",
    description: "Proposta, histórico, compartilhamento e operação comercial fazem parte da plataforma e do fechamento.",
    icon: "quote",
  },
  {
    title: "Base full stack",
    metric: "React + Node + MongoDB",
    description: "Frontend, backend, autenticação, dados e deploy foram pensados como um único ecossistema profissional.",
    icon: "services",
  },
]

export const transformationPoints = [
  {
    title: "Mais impacto na primeira dobra",
    before: "Uma home que apresenta quem fez o projeto, mas demora para provar profundidade.",
    after: "Uma abertura que já mostra autoridade, produto publicado, stack e motivo claro para continuar a conversa.",
  },
  {
    title: "Captação com continuidade",
    before: "CTA bonito, mas sem mostrar como a experiência continua depois do contato.",
    after: "Cases, módulos e provas visuais que conectam marketing, proposta, atendimento e operação no mesmo produto.",
  },
  {
    title: "Portfólio com cara de software",
    before: "Seções parecidas entre si e pouca hierarquia editorial na leitura.",
    after: "Blocos com mais contraste, direção visual e leitura executiva sobre valor, stack, entrega e credibilidade.",
  },
]

export function getFounderTimelineEntries() {
  return [
    ...resumeData.experience.map((item) => ({ ...item, category: "Experiência" })),
    ...(resumeData.education[0] ? [{ ...resumeData.education[0], category: "Formação" }] : []),
  ]
}

export {
  aboutHighlights,
  curatedRepositories,
  featuredProjects,
  primaryCase,
  productModules,
  productSignals,
  publicCapabilityBlocks,
  serviceCatalog,
  showcaseShots,
  socialProofCards,
  stackGroups,
}
