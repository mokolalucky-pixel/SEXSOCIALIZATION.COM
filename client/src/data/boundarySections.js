export const boundarySections = [
  {
    id: 'communication',
    title: 'Communication rhythm',
    description: 'Set expectations for replies, quiet hours, and check-ins before problems escalate.',
    items: [
      {
        id: 'daily-check-in-window',
        label: 'Preferred daily check-in window is documented',
      },
      {
        id: 'quiet-hours',
        label: 'Quiet hours and do-not-disturb times are agreed',
      },
      {
        id: 'conversation-pause',
        label: 'Both partners know how to pause a difficult conversation',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy and consent',
    description: 'Capture what can be shared, stored, screenshotted, or revisited later.',
    items: [
      {
        id: 'private-content-rules',
        label: 'Private content sharing rules are explicit',
      },
      {
        id: 'screenshot-recording-boundaries',
        label: 'Screenshot and recording boundaries are explicit',
      },
      {
        id: 'consent-withdrawal',
        label: 'Either partner can withdraw consent and request deletion',
      },
    ],
  },
  {
    id: 'conflict',
    title: 'Conflict repair plan',
    description: 'Create a low-pressure path for cooling down, apologizing, and reconnecting.',
    items: [
      {
        id: 'cooldown-time-limit',
        label: 'Cooldown time limit is agreed',
      },
      {
        id: 'repair-conversation-format',
        label: 'Repair conversation format is agreed',
      },
      {
        id: 'safety-support-steps',
        label: 'Escalation or safety support steps are documented',
      },
    ],
  },
]

export function countBoundaryItems(sections = boundarySections) {
  return sections.reduce((count, section) => count + section.items.length, 0)
}
