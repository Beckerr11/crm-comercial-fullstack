import { Link } from "react-router-dom"
import { useRealtime } from "../hooks/useRealtime"
import { formatDateTime, truncateText } from "../utils/formatters"
import IconSymbol from "./IconSymbol"

export default function NotificationCenter() {
  const { notifications, unreadCount, markAllNotificationsAsRead, markNotificationAsRead, connectionState } = useRealtime()

  return (
    <details className="notification-center">
      <summary className="notification-trigger">
        <span className="notification-icon-wrap">
          <IconSymbol className="icon-sm" name="notification" />
        </span>
        <span>Notificações</span>
        <span className={`notification-count ${unreadCount ? "active" : ""}`}>{unreadCount}</span>
      </summary>

      <div className="surface notification-panel">
        <div className="notification-panel-header">
          <div>
            <p className="eyebrow">Tempo real</p>
            <h3>{connectionState === "online" ? "Conectado" : connectionState === "connecting" ? "Conectando" : "Offline"}</h3>
          </div>
          <button className="button ghost small" onClick={() => void markAllNotificationsAsRead()} type="button">
            Marcar todas como lidas
          </button>
        </div>

        <div className="notification-list">
          {notifications.length === 0 ? (
            <p className="empty-state">Sem notificações recentes.</p>
          ) : (
            notifications.slice(0, 8).map((notification) => (
              <article className={`notification-item ${notification.readAt ? "" : "unread"}`} key={notification._id}>
                <div>
                  <strong>{notification.title}</strong>
                  <p>{truncateText(notification.message, 88)}</p>
                  <small>{formatDateTime(notification.createdAt)}</small>
                </div>
                <div className="notification-item-actions">
                  {notification.link ? (
                    <Link className="inline-link" to={notification.link}>
                      Abrir
                    </Link>
                  ) : null}
                  {!notification.readAt ? (
                    <button className="button secondary small" onClick={() => void markNotificationAsRead(notification._id)} type="button">
                      Marcar como lida
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </details>
  )
}
