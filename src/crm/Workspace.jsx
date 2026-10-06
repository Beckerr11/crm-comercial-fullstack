import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiChevronRight,
  FiCopy,
  FiFileText,
  FiGrid,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiRefreshCw,
  FiUsers,
  FiX,
} from "react-icons/fi";
import {
  Badge,
  Brand,
  date,
  Empty,
  Field,
  Modal,
  money,
  QuoteDocument,
  request,
  Search,
  statuses,
} from "./ui";
import { EntityForm, QuoteForm } from "./forms";
const nav = [
  ["overview", "Visão geral", FiGrid],
  ["clients", "Clientes", FiUsers],
  ["products", "Serviços", FiLayers],
  ["quotes", "Propostas", FiFileText],
];
const titles = Object.fromEntries(nav.map(([key, label]) => [key, label]));
export default function Workspace() {
  const sidebarRef = useRef(null);
  const navigate = useNavigate(),
    { section = "overview" } = useParams();
  const [session, setSession] = useState(null),
    [w, setW] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [menu, setMenu] = useState(false),
    [modal, setModal] = useState(null),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [shareLink, setShareLink] = useState("");
  const refresh = useCallback(async () => {
    try {
      const [s, workspace] = await Promise.all([
        request("/session"),
        request("/workspace"),
      ]);
      setSession(s);
      setW(workspace);
      setError("");
    } catch (err) {
      if (err.status === 401) navigate("/", { replace: true });
      else setError(err.message);
    }
  }, [navigate]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    if (!menu) return;
    const previous = document.activeElement;
    const links = [
      ...sidebarRef.current.querySelectorAll("a[href],button:not([disabled])"),
    ];
    links[0]?.focus();
    const keys = (event) => {
      if (event.key === "Escape") setMenu(false);
      if (event.key === "Tab") {
        const first = links[0],
          last = links.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
      previous?.focus({ preventScroll: true });
    };
  }, [menu]);
  async function command(path, payload = {}, method = "POST") {
    setBusy(true);
    setError("");
    try {
      const result = await request(path, {
        method,
        headers: {
          "x-csrf-token": session.csrf,
          "x-workspace-version": String(w.version),
        },
        body: JSON.stringify(payload),
      });
      if (result.workspace) setW(result.workspace);
      return result;
    } catch (err) {
      if (err.status === 401) navigate("/");
      if (err.status === 409) await refresh();
      setError(err.message);
      throw err;
    } finally {
      setBusy(false);
    }
  }
  function open(kind, item = null) {
    setError("");
    setShareLink("");
    setModal({ kind, item });
  }
  function close() {
    setModal(null);
    setError("");
    setShareLink("");
  }
  async function action(path, payload, message, method) {
    try {
      const result = await command(path, payload, method);
      if (message) setNotice(message);
      return result;
    } catch {
      return null;
    }
  }
  if (!w)
    return (
      <main className="loading">
        <Brand />
        <p role={error ? "alert" : "status"}>
          {error || "Abrindo seu espaço…"}
        </p>
        {error && (
          <button className="button primary" onClick={refresh}>
            Tentar novamente
          </button>
        )}
      </main>
    );
  if (!titles[section])
    return (
      <main className="loading">
        <h1>Página não encontrada</h1>
        <Link to="/app">Voltar ao painel</Link>
      </main>
    );
  const currentQuote =
    modal?.kind === "detail"
      ? w.quotes.find((q) => q.id === modal.item.id)
      : null;
  const matches = (value) =>
    value.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"));
  const approved = w.quotes.filter((q) => q.status === "approved"),
    sent = w.quotes.filter((q) => q.status === "sent");
  const quoteRows = w.quotes.filter(
    (q) =>
      matches(`${q.number} ${q.client.name} ${q.client.company}`) &&
      (filter === "all" || q.status === filter),
  );
  return (
    <div className="workspace">
      <a className="skip-link" href="#content">
        Pular para conteúdo
      </a>
      {menu && (
        <button
          className="menu-shade"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside ref={sidebarRef} className={`sidebar ${menu ? "open" : ""}`}>
        <Link className="brand-link" to="/app">
          <Brand />
        </Link>
        <button
          className="icon-button sidebar-close"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        >
          <FiX />
        </button>
        <p className="sidebar-label">SEU ESPAÇO DE TRABALHO</p>
        <nav>
          {nav.map(([key, title, Icon]) => (
            <NavLink
              key={key}
              to={key === "overview" ? "/app" : `/app/${key}`}
              end
              onClick={() => {
                setMenu(false);
                setQuery("");
                setFilter("all");
              }}
            >
              <Icon />
              {title}
              {key === "quotes" && (
                <span className="nav-count" aria-hidden="true">
                  {w.quotes.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-profile">
            <span className="avatar small">
              {w.demo ? "DE" : w.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{w.demo ? "Modo demonstração" : "Meu workspace"}</strong>
              <span>
                {w.demo ? "Dados fictícios · 24 horas" : "Conta pessoal"}
              </span>
            </div>
          </div>
          <button
            className="exit"
            onClick={async () => {
              if (await action("/logout")) navigate("/");
            }}
            disabled={busy}
          >
            <FiLogOut /> Sair do espaço
          </button>
        </div>
      </aside>
      <div className="workspace-body" inert={menu}>
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Abrir menu"
            onClick={() => setMenu(true)}
          >
            <FiMenu />
          </button>
          <span>
            Workspace <FiChevronRight /> <strong>{titles[section]}</strong>
          </span>
          <button
            className="button ghost compact"
            onClick={refresh}
            disabled={busy}
            aria-label="Atualizar dados"
          >
            <FiRefreshCw />
            <span>Atualizar</span>
          </button>
        </header>
        <main id="content" className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {section === "overview"
                  ? "CADA DETALHE CONTA"
                  : "ORGANIZAÇÃO QUE FAZ DIFERENÇA"}
              </span>
              <h1>
                {titles[section]}
                <span className="heading-dot" aria-hidden="true">
                  .
                </span>
              </h1>
              <p>
                {
                  {
                    overview: "Tudo o que move seu negócio, em um só lugar.",
                    clients: "Boas relações começam com os detalhes certos.",
                    products: "Transforme sua experiência em uma oferta clara.",
                    quotes: "Da primeira ideia ao próximo negócio fechado.",
                  }[section]
                }
              </p>
            </div>
            <button
              className="button primary"
              onClick={() =>
                open(
                  section === "clients"
                    ? "client"
                    : section === "products"
                      ? "product"
                      : "quote",
                )
              }
            >
              <FiPlus />
              {section === "clients"
                ? "Novo cliente"
                : section === "products"
                  ? "Novo serviço"
                  : "Nova proposta"}
            </button>
          </div>
          {w.demo && (
            <div className="demo-banner">
              <span>
                <span className="live-dot" />
                <strong>Um espaço só seu para experimentar.</strong> Dados
                fictícios; disponível até {date(w.expiresAt)}.
              </span>
              <button onClick={() => open("reset")}>
                Restaurar exemplo <FiRefreshCw />
              </button>
            </div>
          )}
          {error && !modal && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="notice">
              {notice}
              <button
                className="icon-button"
                aria-label="Dispensar aviso"
                onClick={() => setNotice("")}
              >
                <FiX />
              </button>
            </div>
          )}
          {section === "overview" && (
            <>
              <div className="stats">
                <article className="stat featured">
                  <span>
                    VALOR APROVADO <FiArrowUpRight />
                  </span>
                  <strong>
                    {money(approved.reduce((sum, q) => sum + q.totalCents, 0))}
                  </strong>
                  <p>
                    {approved.length} proposta{approved.length !== 1 ? "s" : ""}{" "}
                    aprovada{approved.length !== 1 ? "s" : ""} · todas as datas
                  </p>
                </article>
                <article className="stat">
                  <span>
                    EM NEGOCIAÇÃO <FiArrowUpRight />
                  </span>
                  <strong>
                    {money(sent.reduce((sum, q) => sum + q.totalCents, 0))}
                  </strong>
                  <p>
                    {sent.length} proposta{sent.length !== 1 ? "s" : ""}{" "}
                    aguardando resposta
                  </p>
                </article>
                <article className="stat">
                  <span>
                    CLIENTES NO SEU ESPAÇO <FiUsers />
                  </span>
                  <strong>{String(w.clients.length).padStart(2, "0")}</strong>
                  <p>Relações que viram oportunidades</p>
                </article>
              </div>
              <div className="overview-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Propostas recentes</h2>
                      <p>Os próximos passos do seu negócio.</p>
                    </div>
                    <Link to="/app/quotes">
                      Ver todas <FiArrowUpRight />
                    </Link>
                  </div>
                  <QuoteTable
                    quotes={w.quotes.slice(0, 5)}
                    onOpen={(q) => open("detail", q)}
                  />
                </section>
                <section className="panel pipeline">
                  <span className="eyebrow">SEU FUNIL, SEM COMPLICAÇÃO</span>
                  <h2>
                    Há trabalho
                    <br />
                    acontecendo aqui.
                  </h2>
                  <p>
                    Cada proposta tem uma etapa. Acompanhe o que precisa da sua
                    atenção.
                  </p>
                  {Object.entries(statuses).map(([key, label]) => {
                    const count = w.quotes.filter(
                      (q) => q.status === key,
                    ).length;
                    return (
                      <div className="pipeline-row" key={key}>
                        <span>{label}</span>
                        <strong>{count}</strong>
                        <div>
                          <i
                            className={key}
                            style={{
                              width: `${w.quotes.length ? (count / w.quotes.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </section>
              </div>
              <div className="tip">
                <span className="tip-icon">
                  <FiArrowDownLeft />
                </span>
                <div>
                  <strong>Um bom negócio começa com uma boa proposta.</strong>
                  <p>
                    Adicione os serviços, revise os valores e compartilhe um
                    link com seu cliente.
                  </p>
                </div>
                <button className="button ghost" onClick={() => open("quote")}>
                  Vamos criar <FiArrowUpRight />
                </button>
              </div>
            </>
          )}
          {section === "quotes" && (
            <section className="panel">
              <div className="list-toolbar">
                <div className="tabs" aria-label="Filtrar propostas">
                  {[["all", "Todas"], ...Object.entries(statuses)].map(
                    ([key, label]) => (
                      <button
                        key={key}
                        aria-pressed={filter === key}
                        className={filter === key ? "selected" : ""}
                        onClick={() => setFilter(key)}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
                <Search
                  value={query}
                  onChange={setQuery}
                  placeholder="Buscar proposta ou cliente"
                />
              </div>
              <QuoteTable
                quotes={quoteRows}
                onOpen={(q) => open("detail", q)}
              />
            </section>
          )}
          {section === "clients" && (
            <section className="panel">
              <div className="list-toolbar">
                <strong>{w.clients.length} clientes cadastrados</strong>
                <Search
                  value={query}
                  onChange={setQuery}
                  placeholder="Buscar cliente"
                />
              </div>
              <div className="client-grid">
                {w.clients
                  .filter((c) => matches(`${c.name} ${c.company} ${c.email}`))
                  .map((c) => (
                    <article className="client-card" key={c.id}>
                      <div className="client-card-top">
                        <span className="avatar">
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <button
                          className="text-button"
                          onClick={() => open("client", c)}
                        >
                          Editar <FiArrowUpRight />
                        </button>
                      </div>
                      <h2>{c.name}</h2>
                      <p>{c.company || "Cliente independente"}</p>
                      <div className="client-contact">
                        <span>{c.email || "E-mail não informado"}</span>
                        <span>{c.phone || "Telefone não informado"}</span>
                      </div>
                      <div className="client-card-footer">
                        <span>
                          {w.quotes.filter((q) => q.client.id === c.id).length}{" "}
                          propostas
                        </span>
                        <button
                          className="text-button danger"
                          onClick={() => open("delete-client", c)}
                        >
                          Excluir
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
              {!w.clients.filter((c) =>
                matches(`${c.name} ${c.company} ${c.email}`),
              ).length && (
                <Empty title="Nenhum cliente por aqui">
                  Cadastre seu primeiro cliente ou ajuste a busca.
                </Empty>
              )}
            </section>
          )}
          {section === "products" && (
            <section className="panel">
              <div className="list-toolbar">
                <strong>{w.products.length} serviços no catálogo</strong>
                <Search
                  value={query}
                  onChange={setQuery}
                  placeholder="Buscar serviço"
                />
              </div>
              <div className="service-list">
                {w.products
                  .filter((p) => matches(`${p.name} ${p.description}`))
                  .map((p) => (
                    <article key={p.id}>
                      <span className="service-icon">
                        <FiLayers />
                      </span>
                      <div>
                        <h2>{p.name}</h2>
                        <p>{p.description || "Sem descrição adicional."}</p>
                      </div>
                      <strong>{money(p.unitPriceCents)}</strong>
                      <div className="service-actions">
                        <button
                          className="text-button"
                          onClick={() => open("product", p)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-button danger"
                          onClick={() => open("delete-product", p)}
                        >
                          Excluir
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
              {!w.products.filter((p) => matches(`${p.name} ${p.description}`))
                .length && (
                <Empty title="Seu catálogo começa aqui">
                  Adicione um serviço com nome, descrição e valor.
                </Empty>
              )}
            </section>
          )}
          <footer className="workspace-footer">
            <span>Organize. Apresente. Feche.</span>
            <span>folio · Seu trabalho em movimento</span>
          </footer>
        </main>
      </div>
      {modal && (
        <Modal
          title={
            {
              client: modal.item ? "Editar cliente" : "Novo cliente",
              product: modal.item ? "Editar serviço" : "Novo serviço",
              quote: modal.item ? "Editar rascunho" : "Nova proposta",
              detail: currentQuote?.number,
              reset: "Recomeçar a demonstração?",
              "delete-client": "Excluir cliente?",
              "delete-product": "Excluir serviço?",
            }[modal.kind]
          }
          onClose={() => {
            if (!busy) close();
          }}
          wide={["quote", "detail"].includes(modal.kind)}
        >
          {["client", "product"].includes(modal.kind) && (
            <EntityForm
              kind={modal.kind}
              item={modal.item}
              busy={busy}
              onSubmit={async (data) => {
                const collection =
                  modal.kind === "client" ? "clients" : "products";
                if (
                  await action(
                    `/${collection}${modal.item ? `/${modal.item.id}` : ""}`,
                    data,
                    "Cadastro salvo.",
                    modal.item ? "PUT" : "POST",
                  )
                )
                  close();
              }}
            />
          )}
          {modal.kind === "quote" && (
            <QuoteForm
              w={w}
              item={modal.item}
              busy={busy}
              onSubmit={async (data) => {
                const result = await action(
                  `/quotes${modal.item ? `/${modal.item.id}` : ""}`,
                  data,
                  "",
                  modal.item ? "PUT" : "POST",
                );
                if (result) setModal({ kind: "detail", item: result.item });
              }}
            />
          )}
          {modal.kind === "detail" && currentQuote && (
            <>
              <QuoteDocument q={currentQuote} />
              <div className="detail-actions">
                {currentQuote.status === "draft" ? (
                  <>
                    <button
                      className="button ghost"
                      disabled={busy}
                      onClick={() => open("quote", currentQuote)}
                    >
                      Editar rascunho
                    </button>
                    <button
                      className="button primary"
                      disabled={busy}
                      onClick={() =>
                        action(
                          `/quotes/${currentQuote.id}/send`,
                          {},
                          "Proposta pronta para compartilhar.",
                        )
                      }
                    >
                      Enviar proposta <FiArrowUpRight />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="button ghost"
                      disabled={busy}
                      onClick={async () => {
                        const result = await action(
                          `/quotes/${currentQuote.id}/revise`,
                        );
                        if (result) open("quote", result.item);
                      }}
                    >
                      Criar nova revisão
                    </button>
                    {currentQuote.status === "sent" && (
                      <button
                        className="button primary"
                        disabled={busy}
                        onClick={async () => {
                          const result = await action(
                            `/quotes/${currentQuote.id}/share`,
                            { days: 7 },
                          );
                          if (result)
                            setShareLink(
                              `${window.location.origin}/p/${result.token}`,
                            );
                        }}
                      >
                        {currentQuote.share
                          ? "Gerar novo link"
                          : "Criar link público"}{" "}
                        <FiArrowUpRight />
                      </button>
                    )}
                  </>
                )}
              </div>
              {shareLink && (
                <div className="share-box">
                  <Field label="Link da proposta">
                    <input
                      readOnly
                      value={shareLink}
                      onFocus={(e) => e.target.select()}
                    />
                  </Field>
                  <button
                    className="button ghost"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareLink);
                        setNotice("Link copiado.");
                      } catch {
                        setNotice("Selecione e copie o link acima.");
                      }
                    }}
                  >
                    <FiCopy /> Copiar
                  </button>
                  <a
                    className="text-button"
                    href={shareLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir <FiArrowUpRight />
                  </a>
                </div>
              )}
              {currentQuote.share && (
                <div className="share-note">
                  <span>
                    Link válido até {date(currentQuote.share.expiresAt)}. Gerar
                    outro invalida o anterior.
                  </span>
                  <button
                    className="text-button danger"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await action(
                          `/quotes/${currentQuote.id}/revoke`,
                          {},
                          "Link revogado.",
                        )
                      )
                        setShareLink("");
                    }}
                  >
                    Revogar link
                  </button>
                </div>
              )}
              <section className="history">
                <h3>Histórico da proposta</h3>
                {currentQuote.history.map((event) => (
                  <div key={event.id}>
                    <span className="history-dot" />
                    <span>{event.label}</span>
                    <time>{date(event.at)}</time>
                  </div>
                ))}
                {currentQuote.revisions.length > 0 && (
                  <details>
                    <summary>
                      {currentQuote.revisions.length} revisão(ões) arquivada(s)
                    </summary>
                    {currentQuote.revisions.map((r) => (
                      <div key={r.revision}>
                        Revisão {r.revision} · {statuses[r.status]} ·{" "}
                        {money(r.totalCents)}
                      </div>
                    ))}
                  </details>
                )}
              </section>
            </>
          )}
          {["reset", "delete-client", "delete-product"].includes(
            modal.kind,
          ) && (
            <>
              <p className="confirmation">
                {modal.kind === "reset"
                  ? "Os registros deste espaço serão substituídos pelos exemplos iniciais. Links compartilhados deixarão de funcionar."
                  : modal.kind === "delete-client"
                    ? `Excluir ${modal.item.name}? Clientes com propostas ficam preservados para manter o histórico.`
                    : `Excluir ${modal.item.name} do catálogo? Propostas anteriores preservam seus valores.`}
              </p>
              <div className="detail-actions">
                <button className="button ghost" onClick={close}>
                  Cancelar
                </button>
                <button
                  className="button destructive"
                  disabled={busy}
                  onClick={async () => {
                    const result = await action(
                      modal.kind === "reset"
                        ? "/reset"
                        : `/${modal.kind === "delete-client" ? "clients" : "products"}/${modal.item.id}`,
                      {},
                      "Alteração concluída.",
                      modal.kind === "reset" ? "POST" : "DELETE",
                    );
                    if (result) close();
                  }}
                >
                  Confirmar{" "}
                  {modal.kind === "reset" ? "restauração" : "exclusão"}
                </button>
              </div>
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
function QuoteTable({ quotes, onOpen }) {
  if (!quotes.length)
    return (
      <Empty title="Nenhuma proposta encontrada">
        Crie uma proposta ou ajuste os filtros para continuar.
      </Empty>
    );
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>PROPOSTA / CLIENTE</th>
            <th>STATUS</th>
            <th>VALOR</th>
            <th>ATUALIZADA</th>
            <th>
              <span className="sr-only">Abrir</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <tr key={q.id}>
              <td>
                <button className="quote-title" onClick={() => onOpen(q)}>
                  {q.client.company || q.client.name}
                </button>
                <span className="table-sub">
                  {q.number} · {q.client.name}
                </span>
              </td>
              <td>
                <Badge status={q.status} />
              </td>
              <td className="table-value">{money(q.totalCents)}</td>
              <td className="table-date">{date(q.updatedAt)}</td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`Abrir ${q.number}`}
                  onClick={() => onOpen(q)}
                >
                  <FiArrowUpRight />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
