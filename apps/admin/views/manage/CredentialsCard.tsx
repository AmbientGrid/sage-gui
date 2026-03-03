/**
 * CredentialsCard — displays and manages node SSH credentials.
 *
 * Features: view public key, rotate credentials, revoke credentials.
 * Defense-in-depth: never displays private keys (API module strips them).
 */
import { useState, useEffect } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import KeyIcon from '@mui/icons-material/Key'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import DownloadIcon from '@mui/icons-material/Download'

import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'
import * as BKAdmin from '/components/apis/beekeeperAdmin'
import type { NodeCredentials } from '/components/apis/beekeeperAdmin'

import RotateCredentialsDialog from './RotateCredentialsDialog'


type Props = {
  nodeId: string
}

export default function CredentialsCard({ nodeId }: Props) {
  const [creds, setCreds] = useState<NodeCredentials | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [showRotate, setShowRotate] = useState(false)

  useEffect(() => {
    fetchCredentials()
  }, [nodeId])

  async function fetchCredentials() {
    setLoading(true)
    setError(null)
    try {
      const data = await BKAdmin.getNodeCredentials(nodeId)
      setCreds(data)
    } catch (err) {
      if (err instanceof BKAdmin.ApiError && err.code === 404) {
        setCreds(null) // no credentials yet
      } else {
        setError(err instanceof BKAdmin.ApiError ? err.message : 'Failed to load credentials')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke() {
    setRevoking(true)
    try {
      await BKAdmin.revokeNodeCredentials(nodeId)
      setCreds(null)
      setActionMsg('Credentials revoked')
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Revoke failed')
    } finally {
      setRevoking(false)
    }
  }

  function handleRotateSuccess() {
    setActionMsg('Credentials rotated successfully')
    fetchCredentials()
  }

  function handleDownload() {
    if (!creds?.publicKey) return
    const blob = new Blob([creds.publicKey], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nodeId}_ssh_public_key.pub`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <div className="flex items-center justify-between">
          <Typography variant="h6">
            <KeyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            SSH Credentials
          </Typography>
        </div>
        <Divider sx={{ my: 1 }} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {actionMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionMsg(null)}>{actionMsg}</Alert>}

        {loading && <CircularProgress size={24} />}

        {!loading && !creds && !error && (
          <Alert severity="info">No credentials registered for this node.</Alert>
        )}

        {!loading && creds && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Public Key</Typography>
            <TextField
              value={creds.publicKey || ''}
              multiline
              fullWidth
              minRows={3}
              slotProps={{ input: { readOnly: true } }}
              sx={{ mb: 2, fontFamily: 'monospace', fontSize: '0.85em' }}
            />

            <div className="flex" style={{ gap: 8 }}>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                Download Public Key
              </Button>
              <Button
                size="small"
                color="warning"
                startIcon={<RotateLeftIcon />}
                onClick={() => setShowRotate(true)}
              >
                Rotate
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setConfirmRevoke(true)}
                disabled={revoking}
              >
                {revoking ? 'Revoking...' : 'Revoke'}
              </Button>
            </div>
          </>
        )}
      </CardContent>

      {confirmRevoke && (
        <ConfirmationDialog
          title="Revoke Credentials"
          content={<>Revoking credentials for <b>{nodeId}</b> will prevent the node from connecting. This cannot be undone.</>}
          confirmBtnText="Revoke"
          confirmBtnStyle={{ background: '#c70000' }}
          cancelBtn
          onConfirm={handleRevoke}
          onClose={() => setConfirmRevoke(false)}
        />
      )}

      {showRotate && (
        <RotateCredentialsDialog
          nodeId={nodeId}
          onClose={() => setShowRotate(false)}
          onSuccess={handleRotateSuccess}
        />
      )}
    </Card>
  )
}
