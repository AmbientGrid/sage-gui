/**
 * BeehiveDetail — admin beehive detail page.
 *
 * Shows beehive configuration, credential file upload,
 * and delete action with confirmation.
 */
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/DeleteOutline'
import UploadIcon from '@mui/icons-material/UploadFile'
import Chip from '@mui/material/Chip'

import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'
import { useProgress } from '/components/progress/ProgressProvider'

import * as BKAdmin from '/components/apis/beekeeperAdmin'
import type { Beehive, BeehiveCredentialFiles } from '/components/apis/beekeeperAdmin'


const CREDENTIAL_FIELDS: { key: keyof BeehiveCredentialFiles; label: string }[] = [
  { key: 'tls-key', label: 'TLS Key' },
  { key: 'tls-cert', label: 'TLS Certificate' },
  { key: 'ssh-key', label: 'SSH Key' },
  { key: 'ssh-pub', label: 'SSH Public Key' },
  { key: 'ssh-cert', label: 'SSH Certificate' },
]


export default function BeehiveDetail() {
  const { beehiveId } = useParams<{ beehiveId: string }>()
  const navigate = useNavigate()
  const { setLoading } = useProgress()
  const [beehive, setBeehive] = useState<Beehive | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadField, setUploadField] = useState<keyof BeehiveCredentialFiles | null>(null)

  useEffect(() => {
    if (beehiveId) fetchBeehive(beehiveId)
  }, [beehiveId])

  async function fetchBeehive(id: string) {
    setLoading(true)
    setError(null)
    try {
      const data = await BKAdmin.getBeehive(id)
      setBeehive(data)
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Failed to load beehive')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!beehiveId) return
    await BKAdmin.deleteBeehive(beehiveId)
    navigate('/manage/beehives')
  }

  function triggerUpload(field: keyof BeehiveCredentialFiles) {
    setUploadField(field)
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !beehiveId || !uploadField) return

    setUploading(true)
    setError(null)
    try {
      const files: BeehiveCredentialFiles = { [uploadField]: file }
      await BKAdmin.uploadBeehiveCredentials(beehiveId, files)
      setActionMsg(`${uploadField} uploaded successfully`)
      fetchBeehive(beehiveId)
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadField(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Root>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/manage/beehives')}
        sx={{ mb: 2 }}
      >
        Back to Beehives
      </Button>

      <div className="flex items-center justify-between">
        <h1>Beehive: {beehiveId}</h1>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setConfirmDelete(true)}
        >
          Delete
        </Button>
      </div>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {actionMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionMsg(null)}>{actionMsg}</Alert>}

      {beehive && (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">Configuration</Typography>
              <Divider sx={{ my: 1 }} />
              <InfoRow><span>ID:</span> <span>{beehive.id}</span></InfoRow>
              <InfoRow><span>Key Type:</span> <span>{beehive['key-type'] || '—'}</span></InfoRow>
              <InfoRow><span>RMQ Host:</span> <span>{beehive.rmq_host || '—'}</span></InfoRow>
              <InfoRow><span>RMQ Port:</span> <span>{beehive.rmq_port ?? '—'}</span></InfoRow>
              <InfoRow><span>Upload Host:</span> <span>{beehive.upload_host || '—'}</span></InfoRow>
              <InfoRow><span>Upload Port:</span> <span>{beehive.upload_port ?? '—'}</span></InfoRow>
              <InfoRow><span>API:</span> <span>{beehive.api || '—'}</span></InfoRow>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">Credentials</Typography>
              <Divider sx={{ my: 1 }} />
              {CREDENTIAL_FIELDS.map(({ key, label }) => (
                <InfoRow key={key}>
                  <span>{label}:</span>
                  <span className="flex items-center" style={{ gap: 8 }}>
                    {beehive[key] ? (
                      <Chip label="Present" size="small" color="success" variant="outlined" />
                    ) : (
                      <Chip label="Not set" size="small" variant="outlined" />
                    )}
                    <Button
                      size="small"
                      startIcon={<UploadIcon />}
                      onClick={() => triggerUpload(key)}
                      disabled={uploading}
                    >
                      Upload
                    </Button>
                  </span>
                </InfoRow>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {confirmDelete && (
        <ConfirmationDialog
          title={`Delete beehive "${beehiveId}"?`}
          content={<>This will permanently delete beehive <b>{beehiveId}</b> and cannot be undone.</>}
          confirmBtnText="Delete"
          confirmBtnStyle={{ background: '#c70000' }}
          cancelBtn
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </Root>
  )
}

const Root = styled.div`
  padding: 0 10px;
`

const InfoRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 4px 0;
  & > span:first-child {
    font-weight: 600;
    min-width: 120px;
  }
`
