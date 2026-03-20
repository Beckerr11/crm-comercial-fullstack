import { useEffect, useMemo, useState } from "react"
import { apiFetch, patchJson, postJson } from "../services/platformApi"
import { createSocketClient } from "../services/socketClient"
import { useAuth } from "../hooks/useAuth"
import { RealtimeContext } from "./realtimeContextObject"

function normalizeNotification(item) {
  return {
    _id: item?._id || `${item?.type || "notification"}-${item?.createdAt || Date.now()}`,
    type: item?.type || "system",
    title: item?.title || "Atualização",
    message: item?.message || "",
    link: item?.link || "",
    readAt: item?.readAt || null,
    createdAt: item?.createdAt || new Date().toISOString(),
    metadata: item?.metadata || {},
  }
}

export function RealtimeProvider({ children }) {
  const { isAuthenticated, isReady, token } = useAuth()
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [onlineUsers, setOnlineUsers] = useState({})
  const [connectionState, setConnectionState] = useState("offline")

  function resetRealtimeState() {
    setConnectionState("offline")
    setNotifications([])
    setOnlineUsers({})
    setSocket((current) => {
      current?.disconnect()
      return null
    })
  }

  useEffect(() => {
    let cancelled = false

    async function bootstrapNotifications() {
      try {
        const response = await apiFetch("/api/notifications")
        if (!cancelled) {
          setNotifications((response || []).map(normalizeNotification))
        }
      } catch {
        if (!cancelled) {
          setNotifications([])
        }
      }
    }

    if (!isReady || !isAuthenticated || !token) {
      const resetTimer = window.setTimeout(() => {
        resetRealtimeState()
      }, 0)
      return () => {
        cancelled = true
        window.clearTimeout(resetTimer)
      }
    }

    void bootstrapNotifications()

    const nextSocket = createSocketClient(token)
    const connectTimer = window.setTimeout(() => {
      setSocket(nextSocket)
      setConnectionState("connecting")
    }, 0)

    nextSocket.on("connect", () => {
      setConnectionState("online")
    })

    nextSocket.on("disconnect", () => {
      setConnectionState("offline")
    })

    nextSocket.on("notification:new", (payload) => {
      const normalized = normalizeNotification(payload)
      setNotifications((current) => {
        const withoutDuplicate = current.filter((item) => item._id !== normalized._id)
        return [normalized, ...withoutDuplicate].slice(0, 30)
      })
    })

    nextSocket.on("chat:online", ({ username }) => {
      setOnlineUsers((current) => ({ ...current, [username]: true }))
    })

    nextSocket.on("chat:offline", ({ username }) => {
      setOnlineUsers((current) => ({ ...current, [username]: false }))
    })

    return () => {
      cancelled = true
      window.clearTimeout(connectTimer)
      nextSocket.disconnect()
      setSocket(null)
    }
  }, [isAuthenticated, isReady, token])

  const value = useMemo(
    () => ({
      socket,
      notifications,
      onlineUsers,
      connectionState,
      unreadCount: notifications.filter((item) => !item.readAt).length,
      async refreshNotifications() {
        const response = await apiFetch("/api/notifications")
        const normalized = (response || []).map(normalizeNotification)
        setNotifications(normalized)
        return normalized
      },
      async markNotificationAsRead(notificationId) {
        const updated = await patchJson(`/api/notifications/${notificationId}/read`, {})
        const normalized = normalizeNotification(updated)
        setNotifications((current) => current.map((item) => (item._id === normalized._id ? normalized : item)))
        return normalized
      },
      async markAllNotificationsAsRead() {
        await postJson("/api/notifications/read-all", {})
        setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })))
      },
    }),
    [connectionState, notifications, onlineUsers, socket]
  )

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}
