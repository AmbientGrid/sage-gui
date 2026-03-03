/**
 * DecommissionCard — multi-step node decommission workflow.
 *
 * Steps:
 * 1. Revoke credentials
 * 2. Unassign beehive (set to null)
 * 3. Log the decommission event
 * 4. Replay state to sync
 */
import { useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import WarningIcon from '@mui/icons-material/WarningAmber'

import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'
import * as BKAdmin from '/components/apis/beekeeperAdmin'


type Props = {
  nodeId: string
  onComplete: () => void
}

const STEPS = [
  'Revoke credentials',
  'Log decommission',
  'Replay state',
]

export default function DecommissionCard({ nodeId, onComplete }: Props) {
  const [confirm, setConfirm] = useState(false)
  const [running, setRunning] = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleDecommission() {
    setRunning(true)
    setError(null)

    try {
      // Step 1: Revoke credentials
      setActiveStep(0)
      try {
        await BKAdmin.revokeNodeCredentials(nodeId)
      } catch (err) {
        // 404 is OK — credentials may not exist
        if (!(err instanceof BKAdmin.ApiError && err.code === 404)) throw err
      }

      // Step 2: Log the decommission event
      setActiveStep(1)
      await BKAdmin.logEntries([{
        node_id: nodeId,
        operation: 'insert',
        field_name: 'mode',
        field_value: 'decommissioned',
        source: 'admin-ui',
      }])

      // Step 3: Replay state
      setActiveStep(2)
      await BKAdmin.replayState()

      setDone(true)
      onComplete()
    } catch (err) {
      setError(err instanceof BKAdmin.ApiError ? err.message : 'Decommission failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" color="error">
          <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Decommission Node
        </Typography>
        <Divider sx={{ my: 1 }} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {done ? (
          <Alert severity="success">
            Node {nodeId} has been decommissioned. Credentials revoked and state replayed.
          </Alert>
        ) : (
          <>
            <Typography sx={{ mb: 2 }}>
              Decommissioning will revoke SSH credentials, log the event, and
              replay state. This operation cannot be undone.
            </Typography>

            {activeStep >= 0 && (
              <Stepper activeStep={activeStep} sx={{ mb: 2 }}>
                {STEPS.map(label => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}

            <Button
              variant="contained"
              color="error"
              onClick={() => setConfirm(true)}
              disabled={running}
              startIcon={running ? <CircularProgress size={16} /> : <WarningIcon />}
            >
              {running ? 'Decommissioning...' : 'Decommission Node'}
            </Button>
          </>
        )}
      </CardContent>

      {confirm && (
        <ConfirmationDialog
          title={`Decommission node ${nodeId}?`}
          content={
            <>
              This will:
              <ul>
                <li>Revoke SSH credentials</li>
                <li>Log the decommission event</li>
                <li>Replay state to synchronize</li>
              </ul>
              <b>This cannot be undone.</b>
            </>
          }
          confirmBtnText="Decommission"
          confirmBtnStyle={{ background: '#c70000' }}
          cancelBtn
          onConfirm={handleDecommission}
          onClose={() => setConfirm(false)}
        />
      )}
    </Card>
  )
}
