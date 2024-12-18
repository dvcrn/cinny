import React, { MouseEventHandler, useCallback, useState } from 'react';
import {
  Box,
  Text,
  IconButton,
  Icon,
  Icons,
  Scroll,
  Switch,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Modal,
  Chip,
  Button,
} from 'folds';
import { MatrixEvent } from 'matrix-js-sdk';
import FocusTrap from 'focus-trap-react';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';
import { SettingTile } from '../../../components/setting-tile';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useAccountDataCallback } from '../../../hooks/useAccountDataCallback';
import { TextViewer } from '../../../components/text-viewer';
import { stopPropagation } from '../../../utils/keyboard';

function AccountData() {
  const mx = useMatrixClient();
  const [view, setView] = useState(false);
  const [accountData, setAccountData] = useState(() => Array.from(mx.store.accountData.values()));
  const [selectedEvent, selectEvent] = useState<MatrixEvent>();

  useAccountDataCallback(
    mx,
    useCallback(
      () => setAccountData(Array.from(mx.store.accountData.values())),
      [mx, setAccountData]
    )
  );

  const handleView: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const target = evt.currentTarget;
    const eventType = target.getAttribute('data-event-type');
    if (eventType) {
      const mEvent = accountData.find((mEvt) => mEvt.getType() === eventType);
      selectEvent(mEvent);
    }
  };

  const handleClose = () => selectEvent(undefined);

  return (
    <Box direction="Column" gap="100">
      <Text size="L400">Account Data</Text>
      <SequenceCard
        className={SequenceCardStyle}
        variant="SurfaceVariant"
        direction="Column"
        gap="400"
      >
        <SettingTile
          title="Global"
          description="Data stored in your global account data."
          after={
            <Button
              onClick={() => setView(!view)}
              variant="Secondary"
              fill="Soft"
              size="300"
              radii="300"
              outlined
              before={
                <Icon src={view ? Icons.ChevronTop : Icons.ChevronBottom} size="100" filled />
              }
            >
              <Text size="B300">{view ? 'Collapse' : 'Expand'}</Text>
            </Button>
          }
        />
        {view && (
          <SettingTile>
            <Box direction="Column" gap="200">
              <Text size="L400">Types</Text>
              <Box gap="200" wrap="Wrap">
                {accountData.map((mEvent) => (
                  <Chip
                    key={mEvent.getType()}
                    variant="Secondary"
                    fill="Soft"
                    radii="Pill"
                    outlined
                    onClick={handleView}
                    data-event-type={mEvent.getType()}
                  >
                    <Text size="T200" truncate>
                      {mEvent.getType()}
                    </Text>
                  </Chip>
                ))}
              </Box>
            </Box>
          </SettingTile>
        )}
      </SequenceCard>
      {selectedEvent && (
        <Overlay open backdrop={<OverlayBackdrop />}>
          <OverlayCenter>
            <FocusTrap
              focusTrapOptions={{
                initialFocus: false,
                onDeactivate: handleClose,
                clickOutsideDeactivates: true,
                escapeDeactivates: stopPropagation,
              }}
            >
              <Modal variant="Surface" size="500">
                <TextViewer
                  name={selectedEvent.getType() ?? 'Source Code'}
                  langName="json"
                  text={JSON.stringify(selectedEvent.getContent(), null, 2)}
                  requestClose={handleClose}
                />
              </Modal>
            </FocusTrap>
          </OverlayCenter>
        </Overlay>
      )}
    </Box>
  );
}

type DeveloperToolsProps = {
  requestClose: () => void;
};
export function DeveloperTools({ requestClose }: DeveloperToolsProps) {
  const [developerTools, setDeveloperTools] = useSetting(settingsAtom, 'developerTools');

  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Developer Tools
            </Text>
          </Box>
          <Box shrink="No">
            <IconButton onClick={requestClose} variant="Surface">
              <Icon src={Icons.Cross} />
            </IconButton>
          </Box>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <Box direction="Column" gap="700">
              <Box direction="Column" gap="100">
                <Text size="L400">Options</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  <SettingTile
                    title="Enable Developer Tools"
                    after={
                      <Switch
                        variant="Primary"
                        value={developerTools}
                        onChange={setDeveloperTools}
                      />
                    }
                  />
                </SequenceCard>
              </Box>
              {developerTools && <AccountData />}
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
