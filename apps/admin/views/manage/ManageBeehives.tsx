/**
 * ManageBeehives — admin beehive management list page.
 *
 * Displays all beehives with config, and provides
 * create/delete actions. Auto-refreshes every 30 seconds.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'

import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import RefreshIcon from '@mui/icons-material/Refresh'

import Table, { type Column } from '/components/table/Table'
import { useProgress } from '/components/progress/ProgressProvider'

import * as BKAdmin from '/components/apis/beekeeperAdmin'
import type { Beehive } from '/components/apis/beekeeperAdmin'

import CreateBeehiveDialog from './CreateBeehiveDialog'


const REFRESH_INTERVAL = 30_000

const columns: Column[] = [
  {
    id: 'id',
    label: 'Beehive ID',
    format: (val: string) => (
      <a href={`/manage/beehives/${val}`} aria-label={`View beehive ${val}`}>{val}</a>
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
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const fetchBeehives = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await BKAdmin.getBeehives()
      setBeehives(data)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Failed to load beehives')
    } finally {
      setLoading(false)
    }
  }, [setLoading])

  useEffect(() => {
    fetchBeehives()
  }, [fetchBeehives])

  // Auto-refresh (stale-data policy)
  useEffect(() => {
    timerRef.current = setInterval(fetchBeehives, REFRESH_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [fetchBeehives])

  return (
    <Root role="main" aria-label="Beehive management">
      <div className="flex items-center justify-between">
        <h1>Manage Beehives</h1>
        <div className="flex" style={{ gap: 8 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchBeehives}
            aria-label="Refresh beehive list"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreate(true)}
            aria-label="Create a new beehive"
          >
            Create Beehive
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

const RefreshNote = styled.div`
  font-size: 0.8em;
  color: #666;
  margin-bottom: 8px;
`
