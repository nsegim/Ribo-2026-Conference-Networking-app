'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Alert } from 'react-bootstrap'
import { importAttendeesCsv, type ImportResult } from '../actions'

export default function ImportCsvForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleImport = () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('csvFile', file)

    startTransition(async () => {
      const res = await importAttendeesCsv(formData)
      setResult(res)
      if (res.success) router.refresh()
    })
  }

  const downloadTemplate = () => {
    const template =
      'email,firstName,lastName,title,company,phone,category\njohndoe@example.com,John,Doe,CEO,Acme Inc,+1234567890,Delegate\n'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attendees_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Import Attendees from CSV</h5>
      </Card.Header>
      <Card.Body>
        <div
          className="border border-2 border-dashed rounded p-5 text-center mb-3"
          style={{ cursor: 'pointer' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            hidden
            onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
          />
          <i className="bi bi-cloud-arrow-up display-4 text-primary mb-3 d-block" />
          <h5>Click to upload CSV file</h5>
          {fileName && (
            <span className="badge bg-primary mt-2">
              <i className="bi bi-file-earmark-spreadsheet me-1" />
              {fileName}
            </span>
          )}
        </div>

        {result && (
          <Alert variant={result.success && result.imported > 0 ? 'success' : 'warning'}>
            {result.success ? (
              <>
                <p className="mb-1">Imported: {result.imported} attendee(s)</p>
                {result.errors.length > 0 && (
                  <>
                    <p className="mb-1">Errors:</p>
                    <ul className="mb-0">
                      {result.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              result.error
            )}
          </Alert>
        )}

        <div className="d-flex justify-content-between">
          <div>
            <Button variant="secondary" className="me-2" onClick={() => router.push('/dashboard/attendees')}>
              Back to List
            </Button>
            <Button variant="outline-primary" onClick={downloadTemplate}>
              <i className="bi bi-download me-1" /> Download Template
            </Button>
          </div>
          <Button variant="primary" onClick={handleImport} disabled={!fileName || pending}>
            {pending ? 'Importing...' : 'Import Attendees'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}
