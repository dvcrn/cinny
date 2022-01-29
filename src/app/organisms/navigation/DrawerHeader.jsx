import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './DrawerHeader.scss';

import { twemojify } from '../../../util/twemojify';

import initMatrix from '../../../client/initMatrix';
import cons from '../../../client/state/cons';
import {
  openSpaceSettings, openPublicRooms, openCreateRoom, openInviteUser,
} from '../../../client/action/navigation';
import { createSpaceShortcut, deleteSpaceShortcut } from '../../../client/action/room';

import { blurOnBubbling } from '../../atoms/button/script';

import Text from '../../atoms/text/Text';
import RawIcon from '../../atoms/system-icons/RawIcon';
import Header, { TitleWrapper } from '../../atoms/header/Header';
import IconButton from '../../atoms/button/IconButton';
import ContextMenu, { MenuItem, MenuHeader } from '../../atoms/context-menu/ContextMenu';

import PlusIC from '../../../../public/res/ic/outlined/plus.svg';
import HashPlusIC from '../../../../public/res/ic/outlined/hash-plus.svg';
import HashSearchIC from '../../../../public/res/ic/outlined/hash-search.svg';
import ChevronBottomIC from '../../../../public/res/ic/outlined/chevron-bottom.svg';
import PinIC from '../../../../public/res/ic/outlined/pin.svg';
import PinFilledIC from '../../../../public/res/ic/filled/pin.svg';

function DrawerHeader({ selectedTab, spaceId }) {
  const [, forceUpdate] = useState({});
  const mx = initMatrix.matrixClient;
  const { spaceShortcut } = initMatrix.roomList;
  const tabName = selectedTab !== cons.tabs.DIRECTS ? 'Home' : 'Direct messages';

  const room = mx.getRoom(spaceId);
  const spaceName = selectedTab === cons.tabs.DIRECTS ? null : (room?.name || null);

  return (
    <Header>
      {spaceName ? (
        <button
          className="drawer-header__btn"
          onClick={() => openSpaceSettings(spaceId)}
          type="button"
          onMouseUp={(e) => blurOnBubbling(e, '.drawer-header__btn')}
        >
          <TitleWrapper>
            <Text variant="s1" weight="medium" primary>{twemojify(spaceName)}</Text>
          </TitleWrapper>
          <RawIcon size="small" src={ChevronBottomIC} />
        </button>
      ) : (
        <TitleWrapper>
          <Text variant="s1" weight="medium" primary>{tabName}</Text>
        </TitleWrapper>
      )}
      {spaceName && (
        <IconButton
          size="extra-small"
          tooltip={spaceShortcut.has(spaceId) ? 'Unpin' : 'Pin to sidebar'}
          src={spaceShortcut.has(spaceId) ? PinFilledIC : PinIC}
          onClick={() => {
            if (spaceShortcut.has(spaceId)) deleteSpaceShortcut(spaceId);
            else createSpaceShortcut(spaceId);
            forceUpdate({});
          }}
        />
      )}
      { selectedTab === cons.tabs.DIRECTS && <IconButton onClick={() => openInviteUser()} tooltip="Start DM" src={PlusIC} size="normal" /> }
      { selectedTab !== cons.tabs.DIRECTS && !spaceName && (
        <>
          <ContextMenu
            content={(hideMenu) => (
              <>
                <MenuHeader>Add room</MenuHeader>
                <MenuItem
                  iconSrc={HashPlusIC}
                  onClick={() => { hideMenu(); openCreateRoom(); }}
                >
                  Create new room
                </MenuItem>
                <MenuItem
                  iconSrc={HashSearchIC}
                  onClick={() => { hideMenu(); openPublicRooms(); }}
                >
                  Add public room
                </MenuItem>
              </>
            )}
            render={(toggleMenu) => (<IconButton onClick={toggleMenu} tooltip="Add room" src={PlusIC} size="normal" />)}
          />
        </>
      )}
    </Header>
  );
}

DrawerHeader.defaultProps = {
  spaceId: null,
};
DrawerHeader.propTypes = {
  selectedTab: PropTypes.string.isRequired,
  spaceId: PropTypes.string,
};

export default DrawerHeader;
