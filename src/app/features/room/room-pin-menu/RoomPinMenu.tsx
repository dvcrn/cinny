/* eslint-disable react/destructuring-assignment */
import React, { forwardRef, MouseEventHandler, useCallback, useMemo, useRef } from 'react';
import { MatrixEvent, RelationType, Room } from 'matrix-js-sdk';
import {
  Avatar,
  Box,
  Chip,
  config,
  Header,
  Icon,
  IconButton,
  Icons,
  Menu,
  Scroll,
  Spinner,
  Text,
  toRem,
} from 'folds';
import { Opts as LinkifyOpts } from 'linkifyjs';
import { HTMLReactParserOptions } from 'html-react-parser';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRoomPinnedEvents } from '../../../hooks/useRoomPinnedEvents';
import * as css from './RoomPinMenu.css';
import { SequenceCard } from '../../../components/sequence-card';
import { useRoomEvent } from '../../../hooks/useRoomEvent';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import {
  AvatarBase,
  ImageContent,
  MessageNotDecryptedContent,
  MessageUnsupportedContent,
  ModernLayout,
  MSticker,
  RedactedContent,
  Reply,
  Time,
  Username,
} from '../../../components/message';
import { UserAvatar } from '../../../components/user-avatar';
import { getMxIdLocalPart, mxcUrlToHttp } from '../../../utils/matrix';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import {
  getEditedEvent,
  getMemberAvatarMxc,
  getMemberDisplayName,
  getStateEvent,
} from '../../../utils/room';
import { GetContentCallback, MessageEvent, StateEvent } from '../../../../types/matrix/room';
import colorMXID from '../../../../util/colorMXID';
import { useMentionClickHandler } from '../../../hooks/useMentionClickHandler';
import { useSpoilerClickHandler } from '../../../hooks/useSpoilerClickHandler';
import {
  factoryRenderLinkifyWithMention,
  getReactCustomHtmlParser,
  LINKIFY_OPTS,
  makeMentionCustomProps,
  renderMatrixMention,
} from '../../../plugins/react-custom-html-parser';
import { RenderMatrixEvent, useMatrixEventRenderer } from '../../../hooks/useMatrixEventRenderer';
import { RenderMessageContent } from '../../../components/RenderMessageContent';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import * as customHtmlCss from '../../../styles/CustomHtml.css';
import { EncryptedContent } from '../message';
import { Image } from '../../../components/media';
import { ImageViewer } from '../../../components/image-viewer';
import { useRoomNavigate } from '../../../hooks/useRoomNavigate';
import { VirtualTile } from '../../../components/virtualizer';
import { usePowerLevelsAPI, usePowerLevelsContext } from '../../../hooks/usePowerLevels';
import { RoomPinnedEventsEventContent } from 'matrix-js-sdk/lib/types';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';

function PinnedMessageLoading() {
  return <Box style={{ height: toRem(48) }} />;
}

function PinnedMessageError() {
  return <Text>Failed to load!</Text>;
}

type PinnedMessageProps = {
  room: Room;
  eventId: string;
  renderContent: RenderMatrixEvent<[MatrixEvent, string, GetContentCallback]>;
  onOpen: (roomId: string, eventId: string) => void;
  canPinEvent: boolean;
};
function PinnedMessage({ room, eventId, renderContent, onOpen, canPinEvent }: PinnedMessageProps) {
  const pinnedEvent = useRoomEvent(room, eventId);
  const useAuthentication = useMediaAuthentication();
  const mx = useMatrixClient();

  const [unpinState, unpin] = useAsyncCallback(
    useCallback(() => {
      const pinEvent = getStateEvent(room, StateEvent.RoomPinnedEvents);
      const content = pinEvent?.getContent<RoomPinnedEventsEventContent>() ?? { pinned: [] };
      const newContent: RoomPinnedEventsEventContent = {
        pinned: content.pinned.filter((id) => id !== eventId),
      };

      return mx.sendStateEvent(room.roomId, StateEvent.RoomPinnedEvents, newContent);
    }, [room, eventId, mx])
  );

  if (pinnedEvent === undefined) return <PinnedMessageLoading />;
  if (pinnedEvent === null) return <PinnedMessageError />;

  const sender = pinnedEvent.getSender()!;
  const displayName = getMemberDisplayName(room, sender) ?? getMxIdLocalPart(sender) ?? sender;
  const senderAvatarMxc = getMemberAvatarMxc(room, sender);
  const getContent = (() => pinnedEvent.getContent()) as GetContentCallback;

  const relation = pinnedEvent.getContent()['m.relates_to'];
  const replyEventId = relation?.['m.in_reply_to']?.event_id;
  const threadRootId = relation?.rel_type === RelationType.Thread ? relation.event_id : undefined;

  const handleOpenClick: MouseEventHandler = (evt) => {
    evt.stopPropagation();
    const evtId = evt.currentTarget.getAttribute('data-event-id');
    if (!evtId) return;
    onOpen(room.roomId, evtId);
  };

  const handleUnpinClick: MouseEventHandler = (evt) => {
    evt.stopPropagation();
    unpin();
  };

  return (
    <ModernLayout
      before={
        <AvatarBase>
          <Avatar size="300">
            <UserAvatar
              userId={sender}
              src={
                senderAvatarMxc
                  ? mxcUrlToHttp(mx, senderAvatarMxc, useAuthentication, 48, 48, 'crop') ??
                    undefined
                  : undefined
              }
              alt={displayName}
              renderFallback={() => <Icon size="200" src={Icons.User} filled />}
            />
          </Avatar>
        </AvatarBase>
      }
    >
      <Box gap="300" justifyContent="SpaceBetween" alignItems="Center" grow="Yes">
        <Box gap="200" alignItems="Baseline">
          <Username style={{ color: colorMXID(sender) }}>
            <Text as="span" truncate>
              <b>{displayName}</b>
            </Text>
          </Username>
          <Time ts={pinnedEvent.getTs()} />
        </Box>
        <Box shrink="No" gap="200" alignItems="Center">
          <Chip
            data-event-id={pinnedEvent.getId()}
            onClick={handleOpenClick}
            variant="Secondary"
            radii="Pill"
          >
            <Text size="T200">Open</Text>
          </Chip>
          {canPinEvent && (
            <IconButton
              data-event-id={pinnedEvent.getId()}
              variant="Secondary"
              size="300"
              radii="Pill"
              onClick={unpinState.status === AsyncStatus.Loading ? undefined : handleUnpinClick}
              aria-disabled={unpinState.status === AsyncStatus.Loading}
            >
              {unpinState.status === AsyncStatus.Loading ? (
                <Spinner size="100" />
              ) : (
                <Icon src={Icons.Cross} size="100" />
              )}
            </IconButton>
          )}
        </Box>
      </Box>
      {replyEventId && (
        <Reply
          room={room}
          replyEventId={replyEventId}
          threadRootId={threadRootId}
          onClick={handleOpenClick}
        />
      )}
      {renderContent(pinnedEvent.getType(), false, pinnedEvent, displayName, getContent)}
    </ModernLayout>
  );
}

type RoomPinMenuProps = {
  room: Room;
  requestClose: () => void;
};
export const RoomPinMenu = forwardRef<HTMLDivElement, RoomPinMenuProps>(
  ({ room, requestClose }, ref) => {
    const mx = useMatrixClient();
    const userId = mx.getUserId()!;
    const powerLevels = usePowerLevelsContext();
    const { canSendStateEvent, getPowerLevel } = usePowerLevelsAPI(powerLevels);
    const canPinEvent = canSendStateEvent(StateEvent.RoomPinnedEvents, getPowerLevel(userId));

    const pinnedEvents = useRoomPinnedEvents(room);
    const sortedPinnedEvent = useMemo(() => Array.from(pinnedEvents).reverse(), [pinnedEvents]);
    const useAuthentication = useMediaAuthentication();
    const [mediaAutoLoad] = useSetting(settingsAtom, 'mediaAutoLoad');
    const [urlPreview] = useSetting(settingsAtom, 'urlPreview');
    const { navigateRoom } = useRoomNavigate();
    const scrollRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
      count: sortedPinnedEvent.length,
      getScrollElement: () => scrollRef.current,
      estimateSize: () => 80,
      overscan: 4,
    });

    const mentionClickHandler = useMentionClickHandler(room.roomId);
    const spoilerClickHandler = useSpoilerClickHandler();

    const linkifyOpts = useMemo<LinkifyOpts>(
      () => ({
        ...LINKIFY_OPTS,
        render: factoryRenderLinkifyWithMention((href) =>
          renderMatrixMention(mx, room.roomId, href, makeMentionCustomProps(mentionClickHandler))
        ),
      }),
      [mx, room, mentionClickHandler]
    );
    const htmlReactParserOptions = useMemo<HTMLReactParserOptions>(
      () =>
        getReactCustomHtmlParser(mx, room.roomId, {
          linkifyOpts,
          useAuthentication,
          handleSpoilerClick: spoilerClickHandler,
          handleMentionClick: mentionClickHandler,
        }),
      [mx, room, linkifyOpts, mentionClickHandler, spoilerClickHandler, useAuthentication]
    );

    const renderMatrixEvent = useMatrixEventRenderer<[MatrixEvent, string, GetContentCallback]>(
      {
        [MessageEvent.RoomMessage]: (event, displayName, getContent) => {
          if (event.isRedacted()) {
            return (
              <RedactedContent reason={event.getUnsigned().redacted_because?.content.reason} />
            );
          }

          return (
            <RenderMessageContent
              displayName={displayName}
              msgType={event.getContent().msgtype ?? ''}
              ts={event.getTs()}
              getContent={getContent}
              mediaAutoLoad={mediaAutoLoad}
              urlPreview={urlPreview}
              htmlReactParserOptions={htmlReactParserOptions}
              linkifyOpts={linkifyOpts}
              outlineAttachment
            />
          );
        },
        [MessageEvent.RoomMessageEncrypted]: (event, displayName) => {
          const eventId = event.getId()!;
          const evtTimeline = room.getTimelineForEvent(eventId);

          const mEvent = evtTimeline?.getEvents().find((e) => e.getId() === eventId);

          if (!mEvent || !evtTimeline) {
            return (
              <Box grow="Yes" direction="Column">
                <Text size="T400" priority="300">
                  <code className={customHtmlCss.Code}>{event.getType()}</code>
                  {' event'}
                </Text>
              </Box>
            );
          }

          return (
            <EncryptedContent mEvent={mEvent}>
              {() => {
                if (mEvent.isRedacted()) return <RedactedContent />;
                if (mEvent.getType() === MessageEvent.Sticker)
                  return (
                    <MSticker
                      content={mEvent.getContent()}
                      renderImageContent={(props) => (
                        <ImageContent
                          {...props}
                          autoPlay={mediaAutoLoad}
                          renderImage={(p) => <Image {...p} loading="lazy" />}
                          renderViewer={(p) => <ImageViewer {...p} />}
                        />
                      )}
                    />
                  );
                if (mEvent.getType() === MessageEvent.RoomMessage) {
                  const editedEvent = getEditedEvent(eventId, mEvent, evtTimeline.getTimelineSet());
                  const getContent = (() =>
                    editedEvent?.getContent()['m.new_content'] ??
                    mEvent.getContent()) as GetContentCallback;

                  return (
                    <RenderMessageContent
                      displayName={displayName}
                      msgType={mEvent.getContent().msgtype ?? ''}
                      ts={mEvent.getTs()}
                      edited={!!editedEvent}
                      getContent={getContent}
                      mediaAutoLoad={mediaAutoLoad}
                      urlPreview={urlPreview}
                      htmlReactParserOptions={htmlReactParserOptions}
                      linkifyOpts={linkifyOpts}
                    />
                  );
                }
                if (mEvent.getType() === MessageEvent.RoomMessageEncrypted)
                  return (
                    <Text>
                      <MessageNotDecryptedContent />
                    </Text>
                  );
                return (
                  <Text>
                    <MessageUnsupportedContent />
                  </Text>
                );
              }}
            </EncryptedContent>
          );
        },
        [MessageEvent.Sticker]: (event, displayName, getContent) => {
          if (event.isRedacted()) {
            return (
              <RedactedContent reason={event.getUnsigned().redacted_because?.content.reason} />
            );
          }
          return (
            <MSticker
              content={getContent()}
              renderImageContent={(props) => (
                <ImageContent
                  {...props}
                  autoPlay={mediaAutoLoad}
                  renderImage={(p) => <Image {...p} loading="lazy" />}
                  renderViewer={(p) => <ImageViewer {...p} />}
                />
              )}
            />
          );
        },
      },
      undefined,
      (event) => {
        if (event.isRedacted()) {
          return <RedactedContent reason={event.getUnsigned().redacted_because?.content.reason} />;
        }
        return (
          <Box grow="Yes" direction="Column">
            <Text size="T400" priority="300">
              <code className={customHtmlCss.Code}>{event.getType()}</code>
              {' event'}
            </Text>
          </Box>
        );
      }
    );

    const handleOpen = (roomId: string, eventId: string) => {
      navigateRoom(roomId, eventId);
      requestClose();
    };

    return (
      <Menu ref={ref} className={css.PinMenu}>
        <Box grow="Yes" direction="Column">
          <Header className={css.PinMenuHeader} size="500">
            <Box grow="Yes">
              <Text size="H5">Pinned Messages</Text>
            </Box>
            <Box shrink="No">
              <IconButton size="300" onClick={requestClose} radii="300">
                <Icon src={Icons.Cross} size="400" />
              </IconButton>
            </Box>
          </Header>
          <Box grow="Yes">
            <Scroll ref={scrollRef} size="300" hideTrack visibility="Hover">
              <Box className={css.PinMenuContent} direction="Column" gap="100">
                <div
                  style={{
                    position: 'relative',
                    height: virtualizer.getTotalSize(),
                  }}
                >
                  {virtualizer.getVirtualItems().map((vItem) => {
                    const eventId = sortedPinnedEvent[vItem.index];
                    if (!eventId) return null;

                    return (
                      <VirtualTile
                        virtualItem={vItem}
                        style={{ paddingBottom: config.space.S200 }}
                        ref={virtualizer.measureElement}
                        key={vItem.index}
                      >
                        <SequenceCard
                          style={{ padding: config.space.S400, borderRadius: config.radii.R300 }}
                          variant="SurfaceVariant"
                          direction="Column"
                        >
                          <PinnedMessage
                            room={room}
                            eventId={eventId}
                            renderContent={renderMatrixEvent}
                            onOpen={handleOpen}
                            canPinEvent={canPinEvent}
                          />
                        </SequenceCard>
                      </VirtualTile>
                    );
                  })}
                </div>
              </Box>
            </Scroll>
          </Box>
        </Box>
      </Menu>
    );
  }
);
