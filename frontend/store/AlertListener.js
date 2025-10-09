import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import CustomAlertModal from '../components/shared/CustomAlertModal';
import { hideAlert } from './slices/alertSlice';

export const AlertListener = ({ children }) => {
  const dispatch = useDispatch();
  const alert = useSelector(state => state.alert);

  const handleClose = () => {
    dispatch(hideAlert());
  };

  return (
    <>
      {children}
      <CustomAlertModal
        visible={alert.isVisible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        buttons={alert.buttons || [{ text: 'Tamam', onPress: () => {} }]}
        onClose={handleClose}
      />
    </>
  );
};

export default AlertListener;