import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowUpRight, FiCheck, FiChevronRight } from "react-icons/fi";
import {
  Badge,
  Brand,
  date,
  Field,
  Modal,
  money,
  QuoteDocument,
  request,
} from "./ui";
export function Landing() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function start(kind, payload) {
    setBusy(true);
    setError("");
    try {
      await request(kind, {
        method: "POST",
        body: JSON.stringify(payload || {}),
      });
      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  function auth(event) {
    event.preventDefault();
    start(
      `/auth/${mode}`,
      Object.fromEntries(new FormData(event.currentTarget)),
    );
  }
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />
        <span className="nav-note">Seu próximo negócio começa aqui.</span>
        <button className="button ghost" onClick={() => setMode("login")}>
          Entrar <FiArrowUpRight />
        </button>
      </header>
      <main className="landing-main">
        <div className="landing-copy">
          <span className="eyebrow">
            <span className="live-dot" /> CRM PARA QUEM CRIA
          </span>
          <h1>
            Menos planilhas.
            <br />
            Mais negócios<span className="serif"> fechados.</span>
          </h1>
          <p>
            Clientes, serviços e propostas em um lugar só. Do primeiro contato
            ao sim do cliente, com clareza em cada etapa.
          </p>
          <div className="landing-actions">
            <button
              className="button primary"
              disabled={busy}
              onClick={() => start("/demo")}
            >
              {busy ? "Preparando seu espaço…" : "Explorar demonstração"}
              <FiArrowUpRight />
            </button>
            <button
              className="button ghost"
              onClick={() => setMode("register")}
            >
              Criar minha conta <FiChevronRight />
            </button>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <p className="demo-note">
            Sem cadastro para explorar · Dados fictícios · Seu espaço por 24
            horas
          </p>
          <div className="landing-proof">
            <span>
              <FiCheck /> Propostas por link
            </span>
            <span>
              <FiCheck /> Histórico de revisões
            </span>
            <span>
              <FiCheck /> Clientes organizados
            </span>
          </div>
        </div>
        <div
          className="landing-visual"
          aria-label="Prévia ilustrativa do painel"
        >
          <div className="preview-bar">
            <span className="live-dot" /> SEU NEGÓCIO, EM MOVIMENTO{" "}
            <span>↗</span>
          </div>
          <div className="preview-content">
            <span className="eyebrow">UMA VISÃO MAIS CLARA</span>
            <h2>
              Cada proposta.
              <br />
              Um novo começo.
            </h2>
            <div className="preview-number">
              R$ 4.800<span>,00</span>
            </div>
            <p>Exemplo de proposta aprovada</p>
            <div className="preview-proposal">
              <span className="avatar">AC</span>
              <div>
                <strong>Ateliê Aurora</strong>
                <span>Design e desenvolvimento web</span>
              </div>
              <Badge status="approved" />
            </div>
            <div className="preview-steps">
              <span>
                <FiCheck /> Criar
              </span>
              <i />
              <span>
                <FiCheck /> Enviar
              </span>
              <i />
              <span>
                <FiCheck /> Aprovar
              </span>
            </div>
          </div>
          <div className="preview-caption">
            Da ideia ao próximo passo. Sem ruído.
          </div>
        </div>
      </main>
      <footer className="landing-footer">
        <span>Folio · CRM comercial por Douglas Silva</span>
        <span>Feito para transformar conversas em projetos.</span>
      </footer>
      {mode && (
        <Modal
          title={
            mode === "register"
              ? "Seu trabalho merece um espaço."
              : "Bom ter você de volta."
          }
          onClose={() => {
            setMode(null);
            setError("");
          }}
        >
          <form onSubmit={auth} className="form-stack">
            {mode === "register" && (
              <Field label="Seu nome">
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                />
              </Field>
            )}
            <Field label="E-mail">
              <input
                name="email"
                type="email"
                required
                maxLength={200}
                autoComplete="email"
              />
            </Field>
            <Field label="Senha">
              <input
                name="password"
                type="password"
                required
                minLength={mode === "register" ? 12 : 1}
                maxLength={128}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
              />
            </Field>
            {mode === "register" && (
              <p className="muted">
                Use pelo menos 12 caracteres. Sua conta começa com um espaço
                vazio e permanente.
              </p>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {busy
                ? "Aguarde…"
                : mode === "register"
                  ? "Criar conta"
                  : "Entrar"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
export function PublicProposal() {
  const { token } = useParams();
  const [q, setQ] = useState(null),
    [error, setError] = useState(""),
    [decision, setDecision] = useState(null),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    request(`/public/${token}`)
      .then((data) => {
        if (live) setQ(data);
      })
      .catch((err) => {
        if (live) setError(err.message);
      });
    return () => {
      live = false;
    };
  }, [token]);
  async function decide() {
    setBusy(true);
    setError("");
    try {
      setQ(
        await request(`/public/${token}/decision`, {
          method: "POST",
          body: JSON.stringify({ status: decision }),
        }),
      );
      setDecision(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="public-page">
      <header>
        <Link to="/" aria-label="Página inicial">
          <Brand />
        </Link>
        <span>PROPOSTA COMERCIAL</span>
      </header>
      <main>
        <span className="eyebrow">VAMOS CRIAR ALGO JUNTOS</span>
        <h1>Uma proposta para dar o próximo passo.</h1>
        <p className="public-intro">
          Um escopo claro. Um investimento transparente. Revise os detalhes e
          compartilhe sua decisão.
        </p>
        {!q ? (
          <div className="panel public-document">
            <p role={error ? "alert" : "status"}>
              {error || "Carregando proposta…"}
            </p>
          </div>
        ) : (
          <>
            <section className="panel public-document">
              <QuoteDocument q={q} publicView />
              <div className="public-validity">
                Link disponível até {date(q.expiresAt)} · Criada em{" "}
                {date(q.createdAt)}
              </div>
              <button
                className="button ghost print-button"
                onClick={() => window.print()}
              >
                Imprimir proposta
              </button>
            </section>
            {q.status === "sent" ? (
              <div className="public-decision">
                <p>Está tudo certo para seguir?</p>
                <div>
                  <button
                    className="button ghost"
                    onClick={() => setDecision("rejected")}
                  >
                    Recusar proposta
                  </button>
                  <button
                    className="button primary"
                    onClick={() => setDecision("approved")}
                  >
                    Aprovar proposta <FiArrowUpRight />
                  </button>
                </div>
                <small>
                  Ao confirmar, sua decisão será registrada para esta revisão.
                </small>
              </div>
            ) : (
              <div className={`decision-result ${q.status}`} role="status">
                <FiCheck />
                <h2>
                  {q.status === "approved"
                    ? "Proposta aprovada."
                    : "Proposta recusada."}
                </h2>
                <p>
                  Sua decisão foi registrada. Para alterações, solicite uma nova
                  revisão.
                </p>
              </div>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </>
        )}
        <footer>Apresentado com folio · Clareza em cada próximo passo.</footer>
      </main>
      {decision && (
        <Modal
          title={
            decision === "approved"
              ? "Pronto para seguir em frente?"
              : "Confirmar a recusa?"
          }
          onClose={() => {
            if (!busy) setDecision(null);
          }}
        >
          <p className="confirmation">
            Sua decisão será registrada para a revisão {q.revision} de{" "}
            {q.number}, no valor de {money(q.totalCents)}. Uma nova decisão
            exige outra revisão.
          </p>
          <div className="detail-actions">
            <button className="button ghost" onClick={() => setDecision(null)}>
              Voltar aos detalhes
            </button>
            <button
              className={`button ${decision === "approved" ? "primary" : "destructive"}`}
              disabled={busy}
              onClick={decide}
            >
              {busy
                ? "Registrando…"
                : decision === "approved"
                  ? "Confirmar aprovação"
                  : "Confirmar recusa"}
            </button>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
