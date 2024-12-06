import React, { useCallback, useEffect } from 'react';
import { Box, Text, IconButton, Icon, Icons, Scroll, Input, Avatar, Button, Chip } from 'folds';
import { Page, PageContent, PageHeader } from '../../components/page';
import { SequenceCard } from '../../components/sequence-card';
import { SequenceCardStyle } from './styles.css';
import { SettingTile } from '../../components/setting-tile';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getMxIdLocalPart, mxcUrlToHttp } from '../../utils/matrix';
import { UserAvatar } from '../../components/user-avatar';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { nameInitials } from '../../utils/common';
import { copyToClipboard } from '../../utils/dom';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';

function MatrixId() {
  const mx = useMatrixClient();
  const userId = mx.getUserId()!;

  return (
    <Box direction="Column" gap="100">
      <Text size="L400">Matrix ID</Text>
      <SequenceCard
        className={SequenceCardStyle}
        variant="SurfaceVariant"
        direction="Column"
        gap="400"
      >
        <SettingTile
          title={userId}
          after={
            <Chip variant="Secondary" radii="Pill" onClick={() => copyToClipboard(userId)}>
              <Text size="T200">Copy</Text>
            </Chip>
          }
        />
      </SequenceCard>
    </Box>
  );
}

function Profile() {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const userId = mx.getUserId()!;
  const profile = useUserProfile(userId);

  const defaultDisplayName = profile.displayName ?? getMxIdLocalPart(userId) ?? userId;
  const avatarUrl = profile.avatarUrl
    ? mxcUrlToHttp(mx, profile.avatarUrl, useAuthentication, 96, 96, 'crop') ?? undefined
    : undefined;

  return (
    <Box direction="Column" gap="100">
      <Text size="L400">Profile</Text>
      <SequenceCard
        className={SequenceCardStyle}
        variant="SurfaceVariant"
        direction="Column"
        gap="400"
      >
        <SettingTile
          title={
            <Text as="span" size="L400">
              Avatar
            </Text>
          }
          before={
            <Avatar size="500" radii="300">
              <UserAvatar
                userId={userId}
                src={avatarUrl}
                renderFallback={() => <Text size="H4">{nameInitials(defaultDisplayName)}</Text>}
              />
            </Avatar>
          }
        >
          <Box gap="200">
            <Button size="300" variant="Secondary" fill="Soft" outlined radii="300">
              <Text size="B300">Upload</Text>
            </Button>
            {avatarUrl && (
              <Button size="300" variant="Critical" fill="None" radii="300">
                <Text size="B300">Remove</Text>
              </Button>
            )}
          </Box>
        </SettingTile>
        <SettingTile
          title={
            <Text as="span" size="L400">
              Display Name
            </Text>
          }
        >
          <Box direction="Column" grow="Yes" gap="100">
            <Box gap="200">
              <Box grow="Yes" direction="Column">
                <Input defaultValue={defaultDisplayName} variant="Secondary" radii="300" />
              </Box>

              <Button size="400" variant="Secondary" fill="Soft" outlined radii="300">
                <Text size="B400">Save</Text>
              </Button>
            </Box>
          </Box>
        </SettingTile>
      </SequenceCard>
    </Box>
  );
}

function ContactInformation() {
  const mx = useMatrixClient();
  const [threePIdsState, loadThreePIds] = useAsyncCallback(
    useCallback(() => mx.getThreePids(), [mx])
  );
  const threePIds =
    threePIdsState.status === AsyncStatus.Success ? threePIdsState.data.threepids : undefined;

  const emailIds = threePIds?.filter((id) => id.medium === 'email');

  useEffect(() => {
    loadThreePIds();
  }, [loadThreePIds]);

  return (
    <Box direction="Column" gap="100">
      <Text size="L400">Contact Information</Text>
      <SequenceCard
        className={SequenceCardStyle}
        variant="SurfaceVariant"
        direction="Column"
        gap="400"
      >
        <SettingTile title="Email Address" description="Email address attached to your account.">
          <Box>
            {emailIds?.map((email) => (
              <Chip as="span" variant="Secondary" radii="Pill">
                <Text size="T200">{email.address}</Text>
              </Chip>
            ))}
          </Box>
          {/* <Input defaultValue="" variant="Secondary" radii="300" /> */}
        </SettingTile>
      </SequenceCard>
    </Box>
  );
}

type AccountProps = {
  requestClose: () => void;
};
export function Account({ requestClose }: AccountProps) {
  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Account
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
              <Profile />
              <MatrixId />
              <ContactInformation />
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
