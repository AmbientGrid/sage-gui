/**
 * ManageBeehives — admin beehive management list page.
 *
 * Displays all beehives with config, and provides
 * create/delete actions.
 */
import { useState, useEffect } from 'react'
import styled from 'styled-components'

import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import AddIcon from '@mui/icons-material/AddCircleOutline'

import Table, { type Column } from '/components/table/Table'
import { useProgress } from '/components/progress/ProgressProvider'

import * as BKAdmin from '/components/apis/beekeeperAdmin'
import type { Beehive } from '/components/apis/beekeeperAdmin'

import CreateBeehiveDialog from './CreateBeehiveDialog'


const columns: Column[] = [
  {
    id: 'id',
    label: 'Beehive ID',
    format: (val: string) => (
      <a href={`/manage/beehives/${val}`}>{val}</a>
    ),
  },
  { id: 'key-type', label: 'Key Type' },
  { id: 'rmq_host', label: 'RMQ Host' },
  { id: 'rmq_port', label: 'RMQ Port' },
  { id: 'upload_host', label: 'Upload Host' },
  { id: 'upload_port', label: 'Upload Port' },
]


export default function ManageBeehives() {
  const { setLoading } = useProgress()
  const [beehives, setBeehives] = useState<Beehive[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchBeehives()
  }, [])

  async function fetchBeehives() {
    setLoading(true)
    setError(null)
    try {
      const data = await BKAdmin.getBeehives()
      setBeehives(data)
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Failed to load beehives')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Root>
      <div className="flex items-center justify-between">
        <h1>Manage Beehives</h1>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreate(true)}
        >
          Create Beehive
        </Button>
      </div>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Table
        primaryKey="id"
        rows={beehives}
        columns={columns}
        enableSorting
        enableDownload
      />

      {showCreate && (
        <CreateBeehiveDialog
          onClose={() => setShowCreate(false)}
          onSuccess={fetchBeehives}
        />
      )}
    </Root>
  )
}

const Root = styled.div`
  padding: 0 10px;
`
