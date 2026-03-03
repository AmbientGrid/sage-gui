/**
 * ManageNodes — admin node management list page.
 *
 * Displays all registered nodes with status, beehive assignment,
 * and action buttons (register, assign, deploy WES).
 * Auto-refreshes every 30 seconds (stale-data policy).
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'

import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import RefreshIcon from '@mui/icons-material/Refresh'
import HiveIcon from '@mui/icons-material/HiveOutlined'

import Table, { type Column } from '/components/table/Table'
import { useProgress } from '/components/progress/ProgressProvider'

import * as BKAdmin from '/components/apis/beekeeperAdmin'
import type { Node } from '/components/apis/beekeeperAdmin'

import RegisterNodeDialog from './RegisterNodeDialog'
import AssignBeehiveDialog from './AssignBeehiveDialog'


const REFRESH_INTERVAL = 30_000

const columns: Column[] = [
  {
    id: 'id',
    label: 'Node ID',
    format: (val: string) => (
      <a href={`/manage/nodes/${val}`} aria-label={`View node ${val}`}>{val}</a>
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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkAssign, setBulkAssign] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const fetchNodes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await BKAdmin.getNodes()
      setNodes(data)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Failed to load nodes')
    } finally {
      setLoading(false)
    }
  }, [setLoading])

  useEffect(() => {
    fetchNodes()
  }, [fetchNodes])

  // Auto-refresh (stale-data policy)
  useEffect(() => {
    timerRef.current = setInterval(fetchNodes, REFRESH_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [fetchNodes])

  function toggleSelect(nodeId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === nodes.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(nodes.map(n => n.id)))
    }
  }

  const bulkColumns: Column[] = [
    {
      id: '_select',
      label: (
        <Checkbox
          checked={selected.size === nodes.length && nodes.length > 0}
          indeterminate={selected.size > 0 && selected.size < nodes.length}
          onChange={toggleSelectAll}
          aria-label="Select all nodes"
          size="small"
        />
      ) as unknown as string,
      format: (_: unknown, row: Node) => (
        <Checkbox
          checked={selected.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          aria-label={`Select node ${row.id}`}
          size="small"
        />
      ),
    },
    ...columns,
  ]

  return (
    <Root role="main" aria-label="Node management">
      <div className="flex items-center justify-between">
        <h1>Manage Nodes</h1>
        <div className="flex" style={{ gap: 8 }}>
          {selected.size > 0 && (
            <Button
              variant="outlined"
              startIcon={<HiveIcon />}
              onClick={() => setBulkAssign(true)}
              aria-label={`Bulk assign ${selected.size} nodes to beehive`}
            >
              Assign ({selected.size})
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchNodes}
            aria-label="Refresh node list"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowRegister(true)}
            aria-label="Register a new node"
          >
            Register Node
          </Button>
        </div>
      </div>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {lastRefresh && (
        <RefreshNote aria-live="polite">
          Last refreshed: {lastRefresh.toLocaleTimeString()} (auto-refreshes every 30s)
        </RefreshNote>
      )}

      <Table
        primaryKey="id"
        rows={nodes}
        columns={bulkColumns}
        enableSorting
        enableDownload
      />

      {showRegister && (
        <RegisterNodeDialog
          onClose={() => setShowRegister(false)}
          onSuccess={fetchNodes}
        />
      )}

      {bulkAssign && selected.size > 0 && (
        <AssignBeehiveDialog
          nodeId={Array.from(selected).join(', ')}
          currentBeehive={null}
          onClose={() => setBulkAssign(false)}
          onSuccess={() => {
            setSelected(new Set())
            fetchNodes()
          }}
        />
      )}
    </Root>
  )
}

const Root = styled.div`
  padding: 0 10px;
`

const RefreshNote = styled.div`
  font-size: 0.8em;
  color: #666;
  margin-bottom: 8px;
`
