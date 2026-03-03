/**
 * DeployWESConfirmDialog — confirm WES deployment to a node.
 *
 * Supports debug and force flags. Shows loading state during
 * the potentially long-running deployment (120s timeout).
 */
import { useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'

import * as BKAdmin from '/components/apis/beekeeperAdmin'


type Props = {
  nodeId: string
  onClose: () => void
  onSuccess: () => void
}

export default function DeployWESConfirmDialog({ nodeId, onClose, onSuccess }: Props) {
  const [debug, setDebug] = useState(false)
  const [force, setForce] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDeploy() {
    setLoading(true)
    setError(null)
    try {
      await BKAdmin.deployWES(nodeId, debug, force)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'WES deployment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Deploy WES to {nodeId}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography sx={{ mb: 2 }}>
          This will deploy the Waggle Edge Stack to node <strong>{nodeId}</strong>.
          The operation may take up to 2 minutes.
        </Typography>

        <FormControlLabel
          control={<Checkbox checked={debug} onChange={e => setDebug(e.target.checked)} />}
          label="Debug mode"
        />

        <FormControlLabel
          control={<Checkbox checked={force} onChange={e => setForce(e.target.checked)} />}
          label="Force re-deploy"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleDeploy}
          variant="contained"
          color="warning"
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Deploy WES'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
