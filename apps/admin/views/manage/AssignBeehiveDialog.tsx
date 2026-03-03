/**
 * AssignBeehiveDialog — assign a node to a beehive.
 *
 * Fetches available beehives and lets the admin select one.
 */
import { useState, useEffect } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import * as BKAdmin from '/components/apis/beekeeperAdmin'
import type { Beehive } from '/components/apis/beekeeperAdmin'


type Props = {
  nodeId: string
  currentBeehive: string | null
  onClose: () => void
  onSuccess: () => void
}

export default function AssignBeehiveDialog({ nodeId, currentBeehive, onClose, onSuccess }: Props) {
  const [beehiveId, setBeehiveId] = useState(currentBeehive || '')
  const [beehives, setBeehives] = useState<Beehive[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    BKAdmin.getBeehives()
      .then(setBeehives)
      .catch(err => setError('Failed to load beehives'))
  }, [])

  async function handleAssign() {
    if (!beehiveId) return
    setLoading(true)
    setError(null)
    try {
      await BKAdmin.assignBeehive(nodeId, beehiveId)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Assignment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Beehive to {nodeId}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {currentBeehive && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Currently assigned to: <strong>{currentBeehive}</strong>
          </Alert>
        )}

        <TextField
          label="Beehive"
          select
          value={beehiveId}
          onChange={e => setBeehiveId(e.target.value)}
          fullWidth
          required
          sx={{ mt: 1 }}
        >
          {beehives.map(bh => (
            <MenuItem key={bh.id} value={bh.id}>{bh.id}</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={!beehiveId || beehiveId === currentBeehive || loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
