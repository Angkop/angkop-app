// Renders the match-score badge, using the same thresholds/labels as the dashboard
// (packages/shared's getMatchLabel): green >= 70%, yellow 40-69%, red < 40%, always
// paired with a label — see .claude/rules/design.md.
function angkopRenderOverlay(hybridScore, handlers) {
  const existing = document.getElementById('angkop-match-overlay')
  if (existing) existing.remove()

  const percent = Math.round(hybridScore * 100)
  let color = '#dc2626'
  let label = 'Weak Match'
  if (hybridScore >= 0.7) {
    color = '#16a34a'
    label = 'Strong Match'
  } else if (hybridScore >= 0.4) {
    color = '#ca8a04'
    label = 'Partial Match'
  }

  const container = document.createElement('div')
  container.id = 'angkop-match-overlay'
  container.style.cssText = [
    'position: fixed', 'top: 16px', 'right: 16px', 'z-index: 999999',
    'background: #fff', 'color: #111', 'font-family: system-ui, sans-serif',
    'padding: 12px 14px', 'border-radius: 12px', 'box-shadow: 0 4px 16px rgba(0,0,0,0.18)',
    'display: flex', 'flex-direction: column', 'gap: 8px', 'min-width: 200px',
    'border: 1px solid rgba(0,0,0,0.08)'
  ].join(';')

  const titleEl = document.createElement('div')
  titleEl.textContent = 'Angkop Match Score'
  titleEl.style.cssText = 'font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:#888;'

  const scoreRow = document.createElement('div')
  scoreRow.style.cssText = 'display:flex; align-items:center; gap:8px;'

  const badge = document.createElement('span')
  badge.textContent = `${percent}%`
  badge.style.cssText = `background:${color}; color:#fff; font-weight:700; font-size:13px; padding:4px 10px; border-radius:999px;`

  const labelEl = document.createElement('span')
  labelEl.textContent = label
  labelEl.style.cssText = 'font-size:13px; color:#444;'

  scoreRow.appendChild(badge)
  scoreRow.appendChild(labelEl)

  const buttonRow = document.createElement('div')
  buttonRow.style.cssText = 'display:flex; gap:6px;'
  const buttonStyle = 'flex:1; font-size:12px; padding:6px 8px; border-radius:6px; border:1px solid #ddd; background:#f8f8f8; cursor:pointer;'

  const saveButton = document.createElement('button')
  saveButton.textContent = 'Save Job'
  saveButton.style.cssText = buttonStyle
  saveButton.onclick = () => handlers && handlers.onSave && handlers.onSave()

  const dismissButton = document.createElement('button')
  dismissButton.textContent = 'Dismiss'
  dismissButton.style.cssText = buttonStyle
  dismissButton.onclick = () => handlers && handlers.onDismiss && handlers.onDismiss()

  buttonRow.appendChild(saveButton)
  buttonRow.appendChild(dismissButton)

  container.appendChild(titleEl)
  container.appendChild(scoreRow)
  container.appendChild(buttonRow)
  document.body.appendChild(container)
}

window.angkopRenderOverlay = angkopRenderOverlay
