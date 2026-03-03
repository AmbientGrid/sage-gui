/**
 * RotateCredentialsDialog — rotate node SSH credentials.
 *
 * Accepts private and public key files, calls rotateNodeCredentials
 * (which does DELETE + POST internally since the API uses INSERT).
 */
import { useState, useRef } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import UploadIcon from '@mui/icons-material/UploadFile'

import * as BKAdmin from '/components/apis/beekeeperAdmin'


type Props = {
  nodeId: string
  onClose: () => void
  onSuccess: () => void
}

export default function RotateCredentialsDialog({ nodeId, onClose, onSuccess }: Props) {
  const [privateKey, setPrivateKey] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const privateFileRef = useRef<HTMLInputElement>(null)
  const publicFileRef = useRef<HTMLInputElement>(null)

  async function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  async function handlePrivateFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPrivateKey(await readFile(file))
  }

  async function handlePublicFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPublicKey(await readFile(file))
  }

  const isValid = privateKey.length > 0 && publicKey.length > 0

  async function handleRotate() {
    setLoading(true)
    setError(null)
    try {
      await BKAdmin.rotateNodeCredentials(nodeId, privateKey, publicKey)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Credential rotation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rotate Credentials for {nodeId}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Alert severity="warning" sx={{ mb: 2 }}>
          This will delete existing credentials and replace them with a new keypair.
          The node will need to be re-provisioned.
        </Alert>

        <Typography variant="body2" sx={{ mb: 2 }}>
          Generate a keypair with: <code>ssh-keygen -t rsa-sha2-256 -f node_key</code>
        </Typography>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => privateFileRef.current?.click()}
            >
              {privateKey ? 'Private key loaded' : 'Upload Private Key'}
            </Button>
            <input
              ref={privateFileRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handlePrivateFile}
            />
          </div>

          <div>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => publicFileRef.current?.click()}
            >
              {publicKey ? 'Public key loaded' : 'Upload Public Key (.pub)'}
            </Button>
            <input
              ref={publicFileRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handlePublicFile}
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleRotate}
          variant="contained"
          color="warning"
          disabled={!isValid || loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Rotate Credentials'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
