'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Row, Col, Button } from 'react-bootstrap'

export type FilterOptions = {
  companies: string[]
  countries: string[]
  industries: string[]
}

export type DirectoryFiltersValue = {
  search: string
  company: string
  country: string
  industry: string
  availability: string
}

function buildUrl(filters: DirectoryFiltersValue) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.company) params.set('company', filters.company)
  if (filters.country) params.set('country', filters.country)
  if (filters.industry) params.set('industry', filters.industry)
  if (filters.availability) params.set('availability', filters.availability)
  const qs = params.toString()
  return qs ? `/networking-directory?${qs}` : '/networking-directory'
}

export default function DirectoryFilters({
  filters,
  options,
}: {
  filters: DirectoryFiltersValue
  options: FilterOptions
}) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(filters.search)

  const navigate = (next: Partial<DirectoryFiltersValue>) => {
    router.push(buildUrl({ ...filters, ...next }))
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ search: searchInput })
  }

  const hasActiveFilters = filters.company || filters.country || filters.industry || filters.availability || filters.search

  return (
    <div className="directory-filters mb-4">
      <Form onSubmit={handleSearchSubmit} className="mb-3">
        <div className="directory-search-group">
          <i className="bi bi-search directory-search-icon" />
          <Form.Control
            type="text"
            className="directory-search-input"
            placeholder="Search by name, company, or position..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" className="directory-search-btn">
            Search
          </Button>
        </div>
      </Form>

      <Row className="g-2 align-items-end">
        <Col xs={6} md={3}>
          <Form.Label className="small text-muted mb-1">Company</Form.Label>
          <Form.Select
            size="sm"
            value={filters.company}
            onChange={(e) => navigate({ company: e.target.value })}
          >
            <option value="">All companies</option>
            {options.companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} md={3}>
          <Form.Label className="small text-muted mb-1">Country</Form.Label>
          <Form.Select
            size="sm"
            value={filters.country}
            onChange={(e) => navigate({ country: e.target.value })}
          >
            <option value="">All countries</option>
            {options.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} md={3}>
          <Form.Label className="small text-muted mb-1">Industry</Form.Label>
          <Form.Select
            size="sm"
            value={filters.industry}
            onChange={(e) => navigate({ industry: e.target.value })}
          >
            <option value="">All industries</option>
            {options.industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} md={3}>
          <Form.Label className="small text-muted mb-1">Availability</Form.Label>
          <Form.Select
            size="sm"
            value={filters.availability}
            onChange={(e) => navigate({ availability: e.target.value })}
          >
            <option value="">Anyone</option>
            <option value="open">Open to connect</option>
            <option value="busy">Not available right now</option>
          </Form.Select>
        </Col>
      </Row>

      {hasActiveFilters && (
        <div className="mt-2">
          <Button
            variant="link"
            size="sm"
            className="p-0 text-decoration-none"
            onClick={() => {
              setSearchInput('')
              router.push('/networking-directory')
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  )
}
