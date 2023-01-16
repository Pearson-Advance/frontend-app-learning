import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import SidebarContext from 'courseware/course/sidebar/SidebarContext';
import { SIDEBARS } from 'courseware/course/sidebar/sidebars';

function TriggerButton({
  sidebarId,
}) {
  const {
    toggleSidebar,
    currentSidebar,
  } = useContext(SidebarContext);
  const { Trigger } = SIDEBARS[sidebarId];
  const isActive = sidebarId === currentSidebar;
  return (
    <section
      className={classNames('mt-3', { 'border-primary-700': isActive })}
      style={{ borderBottom: isActive ? '2px solid' : null }}
      key={sidebarId}
    >
      <Trigger onClick={() => toggleSidebar(sidebarId)} key={sidebarId} />
    </section>
  );
}

TriggerButton.propTypes = {
  sidebarId: PropTypes.string.isRequired,
};

export default TriggerButton;
