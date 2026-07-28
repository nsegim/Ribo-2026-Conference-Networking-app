'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, Tab, ListGroup, Badge } from 'react-bootstrap'
import { markMessageRead } from '../actions'

type MessageRow = {
  id: number
  otherName: string
  otherCompany: string
  subject: string
  body: string
  sentAt: string
  readAt: string | null
}

export default function InboxClient({ received, sent }: { received: MessageRow[]; sent: MessageRow[] }) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  const handleOpen = (msg: MessageRow, isReceived: boolean) => {
    setExpandedId(expandedId === msg.id ? null : msg.id)
    if (isReceived && !msg.readAt) {
      startTransition(async () => {
        await markMessageRead(msg.id)
        router.refresh()
      })
    }
  }

  const renderList = (messages: MessageRow[], isReceived: boolean) => {
    if (messages.length === 0) {
      return <p className="text-muted py-4 text-center mb-0">Nothing here yet.</p>
    }
    return (
      <ListGroup>
        {messages.map((m) => (
          <ListGroup.Item
            key={m.id}
            action
            onClick={() => handleOpen(m, isReceived)}
            className={isReceived && !m.readAt ? 'fw-bold' : ''}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div>
                  {isReceived ? 'From' : 'To'}: {m.otherName}{' '}
                  <span className="text-muted fw-normal">({m.otherCompany})</span>
                </div>
                <div>{m.subject}</div>
              </div>
              <div className="text-end">
                <small className="text-muted">{new Date(m.sentAt).toLocaleDateString()}</small>
                {isReceived && !m.readAt && (
                  <div>
                    <Badge bg="danger">New</Badge>
                  </div>
                )}
              </div>
            </div>
            {expandedId === m.id && <p className="mt-2 mb-0 fw-normal">{m.body}</p>}
          </ListGroup.Item>
        ))}
      </ListGroup>
    )
  }

  return (
    <div>
      <h1 className="h2 mb-4">Inbox</h1>
      <Tabs defaultActiveKey="received" className="mb-3">
        <Tab eventKey="received" title={`Received (${received.length})`}>
          {renderList(received, true)}
        </Tab>
        <Tab eventKey="sent" title={`Sent (${sent.length})`}>
          {renderList(sent, false)}
        </Tab>
      </Tabs>
    </div>
  )
}
