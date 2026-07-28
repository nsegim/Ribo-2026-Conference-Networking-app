'use client'

import { useEffect } from 'react'

// Bootstrap's JS bundle (modals, dropdowns, collapse) manipulates the DOM directly and must
// only ever run client-side.
export default function BootstrapClient() {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js')
  }, [])

  return null
}
