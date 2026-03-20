import { useContext } from "react"
import { RealtimeContext } from "../context/realtimeContextObject"

export function useRealtime() {
  const context = useContext(RealtimeContext)

  if (!context) {
    throw new Error("useRealtime precisa ser usado dentro de RealtimeProvider.")
  }

  return context
}
