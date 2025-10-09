import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hideAlert } from '../../store/slices/alertSlice';
import CustomAlertModal from './CustomAlertModal';

const SimpleAlertListener = () => {
  const dispatch = useDispatch();
  const alertState = useSelector(state => state.alert);

  const handleClose = () => {
    dispatch(hideAlert());
  };

  if (!alertState.isVisible) {
    return null;
  }

  return (
    <CustomAlertModal
      visible={alertState.isVisible}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      onClose={handleClose}
    />
  );
};

export default SimpleAlertListener;