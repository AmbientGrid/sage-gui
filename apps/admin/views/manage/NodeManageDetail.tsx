/**
 * NodeManageDetail — admin node detail/action page.
 *
 * Shows node state, credentials, and provides actions:
 * assign beehive, deploy WES, sync VSN, manage credentials.
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

import { useProgress } from '/components/progress/ProgressProvider'

import * as BKAdmin from '/components/apis/beekeeperAdmin'
import type { Node } from '/components/apis/beekeeperAdmin'


export default function NodeManageDetail() {
  const { nodeId } = useParams<{ nodeId: string }>()
  const navigate = useNavigate()
  const { setLoading } = useProgress()
  const [node, setNode] = useState<Node | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (nodeId) fetchNode(nodeId)
  }, [nodeId])

  async function fetchNode(id: string) {
    setLoading(true)
    setError(null)
    try {
      const data = await BKAdmin.getNode(id)
      setNode(data)
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Failed to load node')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Root>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/manage/nodes')}
        sx={{ mb: 2 }}
      >
        Back to Nodes
      </Button>

      <h1>Node: {nodeId}</h1>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {node && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">State</Typography>
            <Divider sx={{ my: 1 }} />
            <InfoRow><span>ID:</span> <span>{node.id}</span></InfoRow>
            <InfoRow><span>VSN:</span> <span>{node.vsn || '—'}</span></InfoRow>
            <InfoRow><span>Beehive:</span> <span>{node.beehive || '—'}</span></InfoRow>
            <InfoRow><span>Mode:</span> <span>{node.mode || '—'}</span></InfoRow>
            <InfoRow><span>Name:</span> <span>{node.name || '—'}</span></InfoRow>
            <InfoRow><span>Address:</span> <span>{node.address || '—'}</span></InfoRow>
            <InfoRow><span>Position:</span> <span>{node.position || '—'}</span></InfoRow>
            <InfoRow><span>Altitude:</span> <span>{node.altitude || '—'}</span></InfoRow>
            <InfoRow><span>Server Node:</span> <span>{node.server_node || '—'}</span></InfoRow>
            <InfoRow><span>Internet:</span> <span>{node.internet_connection || '—'}</span></InfoRow>
            <InfoRow><span>Registered:</span> <span>{node.registration_event || '—'}</span></InfoRow>
            <InfoRow><span>WES Deploy:</span> <span>{node.wes_deploy_event || '—'}</span></InfoRow>
          </CardContent>
        </Card>
      )}

      {node && (
        <div className="flex gap-2">
          <Button variant="outlined">Assign Beehive</Button>
          <Button variant="outlined">Deploy WES</Button>
          <Button variant="outlined">Sync VSN</Button>
        </div>
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
