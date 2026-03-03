/**
 * BeehiveDetail — admin beehive detail page.
 *
 * Shows beehive configuration, assigned nodes, and credential
 * upload actions.
 */
import { useState, useEffect } from 'react'
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

import { useProgress } from '/components/progress/ProgressProvider'

import * as BKAdmin from '/components/apis/beekeeperAdmin'
import type { Beehive } from '/components/apis/beekeeperAdmin'


export default function BeehiveDetail() {
  const { beehiveId } = useParams<{ beehiveId: string }>()
  const navigate = useNavigate()
  const { setLoading } = useProgress()
  const [beehive, setBeehive] = useState<Beehive | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    if (!confirm(`Delete beehive "${beehiveId}"? This cannot be undone.`)) return
    try {
      await BKAdmin.deleteBeehive(beehiveId)
      navigate('/manage/beehives')
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Failed to delete beehive')
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
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {beehive && (
        <Card>
          <CardContent>
            <Typography variant="h6">Configuration</Typography>
            <Divider sx={{ my: 1 }} />
            <InfoRow><span>ID:</span> <span>{beehive.id}</span></InfoRow>
            <InfoRow><span>Key Type:</span> <span>{beehive['key-type'] || '—'}</span></InfoRow>
            <InfoRow><span>RMQ Host:</span> <span>{beehive.rmq_host || '—'}</span></InfoRow>
            <InfoRow><span>RMQ Port:</span> <span>{beehive.rmq_port ?? '—'}</span></InfoRow>
            <InfoRow><span>Upload Host:</span> <span>{beehive.upload_host || '—'}</span></InfoRow>
            <InfoRow><span>Upload Port:</span> <span>{beehive.upload_port ?? '—'}</span></InfoRow>
            <InfoRow><span>TLS Cert:</span> <span>{beehive['tls-cert'] ? 'Present' : '—'}</span></InfoRow>
            <InfoRow><span>SSH Pub:</span> <span>{beehive['ssh-pub'] ? 'Present' : '—'}</span></InfoRow>
            <InfoRow><span>API:</span> <span>{beehive.api || '—'}</span></InfoRow>
          </CardContent>
        </Card>
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
