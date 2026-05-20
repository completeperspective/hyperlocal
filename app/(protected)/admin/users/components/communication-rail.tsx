import {
  MailIcon,
  MessageSquareIcon,
  SmartphoneIcon,
  Users2Icon,
} from 'lucide-react'
import { Button } from '@/ui/button'

const CHANNELS = [
  {
    id: 'dm',
    label: 'Direct Message',
    description: 'In-app WebSocket messaging',
    Icon: MessageSquareIcon,
    phase: 'Phase 2',
  },
  {
    id: 'email',
    label: 'Email Blast',
    description: 'Sendgrid broadcast emails',
    Icon: MailIcon,
    phase: 'Phase 2',
  },
  {
    id: 'sms',
    label: 'SMS',
    description: 'Twilio SMS to members',
    Icon: SmartphoneIcon,
    phase: 'Phase 2',
  },
  {
    id: 'groups',
    label: 'User Groups',
    description: 'Segment members into groups',
    Icon: Users2Icon,
    phase: 'Phase 3',
  },
]

export function CommunicationRail() {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 border-b border-border pb-2">
        Communication Channels
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CHANNELS.map(({ id, label, description, Icon, phase }) => (
          <div
            key={id}
            className="rounded-xl border border-border p-5 flex flex-col gap-3 opacity-60"
          >
            <div className="flex items-center">
              <Icon className="size-5 text-muted-foreground" />
              <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                Coming Soon
              </span>
            </div>
            <h3 className="text-base font-semibold">{label}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            <Button
              variant="outline"
              size="sm"
              disabled
              aria-label={`${label} — coming in ${phase}`}
            >
              Notify me
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
