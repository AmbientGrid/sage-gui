/**
 * NodeManageDetail — admin node detail/action page.
 *
 * Shows node state, credentials, and provides actions:
 * assign beehive, deploy WES, sync VSN, manage credentials,
 * decommission, and ChirpStack link.
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
import Chip from '@mui/material/Chip'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import HiveIcon from '@mui/icons-material/HiveOutlined'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import SyncIcon from '@mui/icons-material/Sync'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

import { useProgress } from '/components/progress/ProgressProvider'
import config from '/config'

import * as BKAdmin from '/components/apis/beekeeperAdmin'
import type { Node } from '/components/apis/beekeeperAdmin'

import AssignBeehiveDialog from './AssignBeehiveDialog'
import DeployWESConfirmDialog from './DeployWESConfirmDialog'
import CredentialsCard from './CredentialsCard'
import DecommissionCard from './DecommissionCard'


export default function NodeManageDetail() {
  const { nodeId } = useParams<{ nodeId: string }>()
  const navigate = useNavigate()
  const { setLoading } = useProgress()
  const [node, setNode] = useState<Node | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const [showAssign, setShowAssign] = useState(false)
  const [showDeploy, setShowDeploy] = useState(false)
  const [syncing, setSyncing] = useState(false)

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

  async function handleSyncVSN() {
    if (!nodeId) return
    setSyncing(true)
    setActionMsg(null)
    try {
      await BKAdmin.syncVSN(nodeId)
      setActionMsg('VSN sync initiated')
      fetchNode(nodeId)
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'VSN sync failed')
    } finally {
      setSyncing(false)
    }
  }

  function handleActionSuccess() {
    if (nodeId) fetchNode(nodeId)
    setActionMsg('Action completed successfully')
  }

  // ChirpStack gateway URL — maps node ID to ChirpStack device EUI
  const chirpstackUrl = config.chirpstack
    ? `${config.chirpstack}/#/gateways/${nodeId}`
    : null

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
      {actionMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionMsg(null)}>{actionMsg}</Alert>}

      {node && (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">State</Typography>
              <Divider sx={{ my: 1 }} />
              <InfoRow><span>ID:</span> <span>{node.id}</span></InfoRow>
              <InfoRow><span>VSN:</span> <span>{node.vsn || '—'}</span></InfoRow>
              <InfoRow>
                <span>Beehive:</span>
                <span>{node.beehive ? <Chip label={node.beehive} size="small" /> : '—'}</span>
              </InfoRow>
              <InfoRow>
                <span>Mode:</span>
                <span>{node.mode ? <Chip label={node.mode} size="small" variant="outlined" /> : '—'}</span>
              </InfoRow>
              <InfoRow><span>Name:</span> <span>{node.name || '—'}</span></InfoRow>
              <InfoRow><span>Address:</span> <span>{node.address || '—'}</span></InfoRow>
              <InfoRow><span>Position:</span> <span>{node.position || '—'}</span></InfoRow>
              <InfoRow><span>Altitude:</span> <span>{node.altitude || '—'}</span></InfoRow>
              <InfoRow><span>Project:</span> <span>{node.project_id || '—'}</span></InfoRow>
              <InfoRow><span>Server Node:</span> <span>{node.server_node || '—'}</span></InfoRow>
              <InfoRow><span>Internet:</span> <span>{node.internet_connection || '—'}</span></InfoRow>
              <InfoRow>
                <span>Registered:</span>
                <span>{node.registration_event ? new Date(node.registration_event).toLocaleString() : '—'}</span>
              </InfoRow>
              <InfoRow>
                <span>WES Deploy:</span>
                <span>{node.wes_deploy_event ? new Date(node.wes_deploy_event).toLocaleString() : '—'}</span>
              </InfoRow>
            </CardContent>
          </Card>

          <div className="flex" style={{ gap: 8, marginBottom: 16 }}>
            <Button
              variant="outlined"
              startIcon={<HiveIcon />}
              onClick={() => setShowAssign(true)}
            >
              Assign Beehive
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RocketLaunchIcon />}
              onClick={() => setShowDeploy(true)}
            >
              Deploy WES
            </Button>
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={handleSyncVSN}
              disabled={syncing}
            >
              {syncing ? 'Syncing...' : 'Sync VSN'}
            </Button>
            {chirpstackUrl && (
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                href={chirpstackUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                ChirpStack
              </Button>
            )}
          </div>

          <CredentialsCard nodeId={nodeId!} />

          <DecommissionCard nodeId={nodeId!} onComplete={handleActionSuccess} />
        </>
      )}

      {showAssign && nodeId && (
        <AssignBeehiveDialog
          nodeId={nodeId}
          currentBeehive={node?.beehive || null}
          onClose={() => setShowAssign(false)}
          onSuccess={handleActionSuccess}
        />
      )}

      {showDeploy && nodeId && (
        <DeployWESConfirmDialog
          nodeId={nodeId}
          onClose={() => setShowDeploy(false)}
          onSuccess={handleActionSuccess}
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
    min-width: 140px;
  }
`
