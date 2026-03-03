/**
 * RegisterNodeDialog — register a new node with Beekeeper.
 *
 * Accepts a 16-character uppercase hex node ID and optional beehive.
 * On success, displays the registration response (public key, certificate).
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
import Typography from '@mui/material/Typography'

import * as BKAdmin from '/components/apis/beekeeperAdmin'
import type { Beehive, RegisterResponse } from '/components/apis/beekeeperAdmin'


type Props = {
  onClose: () => void
  onSuccess: () => void
}

export default function RegisterNodeDialog({ onClose, onSuccess }: Props) {
  const [nodeId, setNodeId] = useState('')
  const [beehiveId, setBeehiveId] = useState('')
  const [beehives, setBeehives] = useState<Beehive[]>([])
  const [loadingBeehives, setLoadingBeehives] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RegisterResponse | null>(null)

  useEffect(() => {
    BKAdmin.getBeehives()
      .then(setBeehives)
      .catch(() => { /* beehive list is optional */ })
      .finally(() => setLoadingBeehives(false))
  }, [])

  const isValid = /^[0-9A-F]{16}$/.test(nodeId)

  async function handleRegister() {
    setLoading(true)
    setError(null)
    try {
      const res = await BKAdmin.registerNode(nodeId, beehiveId || undefined)
      setResult(res)
      onSuccess()
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Node Registered</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Node {result.id} registered successfully.
          </Alert>
          <Typography variant="subtitle2">Public Key</Typography>
          <TextField
            value={result.publicKey || ''}
            multiline
            fullWidth
            minRows={2}
            slotProps={{ input: { readOnly: true } }}
            sx={{ mb: 2, fontFamily: 'monospace' }}
          />
          <Typography variant="subtitle2">Certificate</Typography>
          <TextField
            value={result.certificate || ''}
            multiline
            fullWidth
            minRows={2}
            slotProps={{ input: { readOnly: true } }}
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained">Done</Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Register Node</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          label="Node ID"
          placeholder="0000000000000001"
          value={nodeId}
          onChange={e => setNodeId(e.target.value.toUpperCase())}
          fullWidth
          required
          error={nodeId.length > 0 && !isValid}
          helperText={
            nodeId.length > 0 && !isValid
              ? 'Must be exactly 16 uppercase hex characters'
              : 'e.g. 0000000000000001'
          }
          sx={{ mt: 1, mb: 2 }}
          slotProps={{ htmlInput: { maxLength: 16 } }}
        />

        <TextField
          label="Beehive (optional)"
          select
          value={beehiveId}
          onChange={e => setBeehiveId(e.target.value)}
          fullWidth
          disabled={loadingBeehives}
          helperText={loadingBeehives ? 'Loading beehives...' : ''}
          sx={{ mb: 2 }}
        >
          <MenuItem value="">None — assign later</MenuItem>
          {beehives.map(bh => (
            <MenuItem key={bh.id} value={bh.id}>{bh.id}</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleRegister}
          variant="contained"
          disabled={!isValid || loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Register'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
