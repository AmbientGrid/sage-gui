/**
 * CreateBeehiveDialog — create a new beehive.
 *
 * Collects beehive configuration (id, key-type, rmq/upload hosts and ports).
 */
import { useState } from 'react'

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
import type { BeehiveConfig } from '/components/apis/beekeeperAdmin'


type Props = {
  onClose: () => void
  onSuccess: () => void
}

const KEY_TYPES = [
  'rsa-sha2-256',
  'rsa-sha2-512',
  'ssh-ed25519',
]

export default function CreateBeehiveDialog({ onClose, onSuccess }: Props) {
  const [id, setId] = useState('')
  const [keyType, setKeyType] = useState('rsa-sha2-256')
  const [rmqHost, setRmqHost] = useState('')
  const [rmqPort, setRmqPort] = useState('5672')
  const [uploadHost, setUploadHost] = useState('')
  const [uploadPort, setUploadPort] = useState('20443')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = id.trim().length > 0 && keyType.length > 0

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const config: BeehiveConfig = {
        id: id.trim(),
        'key-type': keyType,
      }
      if (rmqHost) config['rmq-host'] = rmqHost
      if (rmqPort) config['rmq-port'] = rmqPort
      if (uploadHost) config['upload-host'] = uploadHost
      if (uploadPort) config['upload-port'] = uploadPort

      await BKAdmin.createBeehive(config)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Failed to create beehive')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Beehive</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          label="Beehive ID"
          placeholder="my-beehive"
          value={id}
          onChange={e => setId(e.target.value)}
          fullWidth
          required
          sx={{ mt: 1, mb: 2 }}
        />

        <TextField
          label="Key Type"
          select
          value={keyType}
          onChange={e => setKeyType(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        >
          {KEY_TYPES.map(kt => (
            <MenuItem key={kt} value={kt}>{kt}</MenuItem>
          ))}
        </TextField>

        <TextField
          label="RMQ Host"
          placeholder="rabbitmq"
          value={rmqHost}
          onChange={e => setRmqHost(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <TextField
          label="RMQ Port"
          placeholder="5672"
          value={rmqPort}
          onChange={e => setRmqPort(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <TextField
          label="Upload Host"
          placeholder="beehive-upload-svc"
          value={uploadHost}
          onChange={e => setUploadHost(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <TextField
          label="Upload Port"
          placeholder="20443"
          value={uploadPort}
          onChange={e => setUploadPort(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!isValid || loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
