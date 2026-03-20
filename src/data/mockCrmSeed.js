function createIsoDate(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString()
}

export function createCrmSeed() {
  const clients = [
    {
      _id: "client-001",
      name: "Ana Costa",
      email: "ana@luminafit.com",
      phone: "11987654321",
      company: "Lumina Fit",
      notes: "Marca fitness focada em captacao por landing e funil comercial.",
      createdAt: createIsoDate(-18),
      updatedAt: createIsoDate(-8),
    },
    {
      _id: "client-002",
      name: "Marcos Oliveira",
      email: "marcos@orbisjuridico.com",
      phone: "11999887766",
      company: "Orbis Juridico",
      notes: "Escritorio buscando proposta institucional com area do cliente.",
      createdAt: createIsoDate(-13),
      updatedAt: createIsoDate(-5),
    },
    {
      _id: "client-003",
      name: "Carla Mendes",
      email: "carla@hubclinic.com",
      phone: "11993456789",
      company: "Hub Clinic",
      notes: "Operacao de saude avaliando CRM comercial e automacoes.",
      createdAt: createIsoDate(-10),
      updatedAt: createIsoDate(-3),
    },
  ]

  const products = [
    {
      _id: "product-001",
      name: "Landing page premium",
      description: "Pagina de conversao com copy comercial, SEO tecnico e CTA forte.",
      unitPrice: 2900,
      createdAt: createIsoDate(-22),
      updatedAt: createIsoDate(-12),
    },
    {
      _id: "product-002",
      name: "CRM comercial",
      description: "Clientes, propostas, catalogo, PDF e acompanhamento do pipeline.",
      unitPrice: 5400,
      createdAt: createIsoDate(-20),
      updatedAt: createIsoDate(-10),
    },
    {
      _id: "product-003",
      name: "Retainer mensal",
      description: "Evolucao continua, backlog, suporte tecnico e melhorias operacionais.",
      unitPrice: 1800,
      createdAt: createIsoDate(-16),
      updatedAt: createIsoDate(-6),
    },
  ]

  const quotes = [
    {
      _id: "quote-001",
      quoteNumber: "ORC-0001",
      publicToken: "public-quote-001",
      clientId: "client-001",
      clientSnapshot: {
        name: "Ana Costa",
        email: "ana@luminafit.com",
        phone: "11987654321",
        company: "Lumina Fit",
      },
      notes: "Entrega em duas etapas com pagina de captacao e painel inicial.",
      status: "approved",
      items: [
        {
          productId: "product-001",
          name: "Landing page premium",
          description: "Estrutura comercial, hero, provas, SEO e CTA.",
          quantity: 1,
          unitPrice: 2900,
        },
        {
          productId: "product-003",
          name: "Retainer mensal",
          description: "Acompanhamento pos-lancamento por 30 dias.",
          quantity: 1,
          unitPrice: 1800,
        },
      ],
      total: 4700,
      createdAt: createIsoDate(-9),
      updatedAt: createIsoDate(-7),
    },
    {
      _id: "quote-002",
      quoteNumber: "ORC-0002",
      publicToken: "public-quote-002",
      clientId: "client-002",
      clientSnapshot: {
        name: "Marcos Oliveira",
        email: "marcos@orbisjuridico.com",
        phone: "11999887766",
        company: "Orbis Juridico",
      },
      notes: "Escopo institucional com area autenticada para documentos e suporte.",
      status: "sent",
      items: [
        {
          productId: "product-001",
          name: "Landing page premium",
          description: "Site institucional com foco comercial.",
          quantity: 1,
          unitPrice: 2900,
        },
      ],
      total: 2900,
      createdAt: createIsoDate(-6),
      updatedAt: createIsoDate(-4),
    },
    {
      _id: "quote-003",
      quoteNumber: "ORC-0003",
      publicToken: "public-quote-003",
      clientId: "client-003",
      clientSnapshot: {
        name: "Carla Mendes",
        email: "carla@hubclinic.com",
        phone: "11993456789",
        company: "Hub Clinic",
      },
      notes: "Proposta para CRM com catalogo, propostas e indicadores iniciais.",
      status: "rejected",
      items: [
        {
          productId: "product-002",
          name: "CRM comercial",
          description: "Base full stack para operacao comercial.",
          quantity: 1,
          unitPrice: 5400,
        },
      ],
      total: 5400,
      createdAt: createIsoDate(-4),
      updatedAt: createIsoDate(-2),
    },
  ]

  return {
    meta: {
      quoteCounter: 3,
    },
    clients,
    products,
    quotes,
  }
}
