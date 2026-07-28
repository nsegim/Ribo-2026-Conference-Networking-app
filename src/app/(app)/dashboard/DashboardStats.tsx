'use client'

import { Row, Col, Card } from 'react-bootstrap'

type Stat = { label: string; value: number; icon: string }

// react-bootstrap isn't built with RSC 'use client' directives internally, so it can't be
// rendered directly inside an async Server Component — this client child is where any
// react-bootstrap UI must live. Server Component pages fetch data via Payload's Local API and
// pass plain serializable props down to components like this one.
export default function DashboardStats({ stats }: { stats: Stat[] }) {
  return (
    <Row className="g-3 mt-2">
      {stats.map((stat) => (
        <Col key={stat.label} md={4} lg={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <i className={`bi ${stat.icon} fs-2 text-primary`} />
              <Card.Title className="mt-2">{stat.label}</Card.Title>
              <h2 className="display-6 mb-0">{stat.value}</h2>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
