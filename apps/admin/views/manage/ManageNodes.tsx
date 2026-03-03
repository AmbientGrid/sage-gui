/**
 * ManageNodes — admin node management list page.
 *
 * Displays all registered nodes with status, beehive assignment,
 * and action buttons (register, assign, deploy WES).
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import AddIcon from '@mui/icons-material/AddCircleOutline'

import Table, { type Column } from '/components/table/Table'
import { useProgress } from '/components/progress/ProgressProvider'

import * as BKAdmin from '/components/apis/beekeeperAdmin'
import type { Node } from '/components/apis/beekeeperAdmin'


const columns: Column[] = [
  {
    id: 'id',
    label: 'Node ID',
    format: (val: string, row: Node) => (
      <a href={`/manage/nodes/${row.id}`}>{val}</a>
    ),
  },
  { id: 'vsn', label: 'VSN' },
  { id: 'beehive', label: 'Beehive' },
  { id: 'mode', label: 'Mode' },
  { id: 'name', label: 'Name' },
  { id: 'address', label: 'Address' },
]


export default function ManageNodes() {
  const navigate = useNavigate()
  const { setLoading } = useProgress()
  const [nodes, setNodes] = useState<Node[]>([])
  const [error, setError] = useState<string | null>(null)

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
          onClick={() => navigate('/manage/nodes/register')}
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
    </Root>
  )
}

const Root = styled.div`
  padding: 0 10px;
`
