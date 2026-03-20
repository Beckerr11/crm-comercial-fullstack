const statusLabels = {
  backlog: "Backlog",
  in_progress: "Em andamento",
  completed: "Concluída",
}

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
}

export default function TaskColumn({ status, tasks, onEdit, onRemove, onMove }) {
  return (
    <section className={`surface task-column task-column-${status}`}>
      <header className="task-column-header">
        <div>
          <p className="eyebrow">Etapa</p>
          <h3>{statusLabels[status]}</h3>
          <p className="section-copy compact">{tasks.length} tarefa(s)</p>
        </div>
        <span className="mini-pill emphasis">{tasks.length}</span>
      </header>

      <div className="task-list">
        {tasks.length === 0 ? (
          <p className="empty-state">Nenhuma tarefa nesta etapa.</p>
        ) : (
          tasks.map((task) => (
            <article className={`task-card task-card-${task.priority || "medium"}`} key={task._id}>
              <div className="task-card-header">
                <h4>{task.title}</h4>
                <span className={`status-badge ${status}`}>{statusLabels[status]}</span>
              </div>
              <p className="task-meta">{task.description || "Sem descrição adicional."}</p>
              <div className="pill-row">
                <span className="mini-pill">Prioridade: {priorityLabels[task.priority] || task.priority}</span>
                {task.deadline || task.date ? <span className="mini-pill">Prazo: {task.deadline || task.date}</span> : null}
              </div>
              <div className="inline-actions">
                <button className="button secondary small" onClick={() => onEdit(task)} type="button">
                  Editar
                </button>
                <button className="button ghost small" onClick={() => onMove(task)} type="button">
                  Mover
                </button>
                <button className="button danger small" onClick={() => onRemove(task._id)} type="button">
                  Excluir
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
