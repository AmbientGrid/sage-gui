/**
 * ManageNodes — admin node management list page.
 *
 * Displays all registered nodes with status, beehive assignment,
 * and action buttons (register, assign, deploy WES).
 */
import { useState, useEffect } from 'react'
import styled from 'styled-components'

import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import AddIcon from '@mui/icons-material/AddCircleOutline'

import Table, { type Column } from '/components/table/Table'
import { useProgress } from '/components/progress/ProgressProvider'

import * as BKAdmin from '/components/apis/beekeeperAdmin'
import type { Node } from '/components/apis/beekeeperAdmin'

import RegisterNodeDialog from './RegisterNodeDialog'


const columns: Column[] = [
  {
    id: 'id',
    label: 'Node ID',
    format: (val: string) => (
      <a href={`/manage/nodes/${val}`}>{val}</a>
    ),
  },
  { id: 'vsn', label: 'VSN' },
  {
    id: 'beehive',
    label: 'Beehive',
    format: (val: string | null) => val || <span style={{ color: '#999' }}>unassigned</span>,
  },
  {
    id: 'mode',
    label: 'Mode',
    format: (val: string | null) =>
      val ? <Chip label={val} size="small" variant="outlined" /> : '—',
  },
  { id: 'name', label: 'Name' },
  { id: 'address', label: 'Address' },
  {
    id: 'registration_event',
    label: 'Registered',
    format: (val: string | null) => val ? new Date(val).toLocaleString() : '—',
  },
]


export default function ManageNodes() {
  const { setLoading } = useProgress()
  const [nodes, setNodes] = useState<Node[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    fetchNodes()
  }, [])

  async function fetchNodes() {
    setLoading(true)
    setError(null)
    try {
      const data = await BKAdmin.getNodes()
      setNodes(data)
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Failed to load nodes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Root>
      <div className="flex items-center justify-between">
        <h1>Manage Nodes</h1>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowRegister(true)}
        >
          Register Node
        </Button>
      </div>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Table
        primaryKey="id"
        rows={nodes}
        columns={columns}
        enableSorting
        enableDownload
      />

      {showRegister && (
        <RegisterNodeDialog
          onClose={() => setShowRegister(false)}
          onSuccess={fetchNodes}
        />
      )}
    </Root>
  )
}

const Root = styled.div`
  padding: 0 10px;
`
