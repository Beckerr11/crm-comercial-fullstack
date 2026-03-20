import IconSymbol from "./IconSymbol"
import { getQuoteStatusIcon, getQuoteStatusLabel } from "../utils/crm"

export default function QuoteStatusBadge({ status }) {
  return (
    <span className={`status-badge quote-${status || "sent"}`}>
      <IconSymbol className="icon-xs" name={getQuoteStatusIcon(status)} />
      {getQuoteStatusLabel(status)}
    </span>
  )
}
