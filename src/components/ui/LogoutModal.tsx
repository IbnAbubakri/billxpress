// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import ConfirmModal from "./ConfirmModal";

interface LogoutModalProps {
  show?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutModal = ({ show = true, onConfirm, onCancel }: LogoutModalProps) => {
  return (
    <ConfirmModal
      show={show}
      title="Confirm Logout"
      message="Are you sure you want to logout?"
      confirmLabel="Logout"
      confirmVariant="primary"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default LogoutModal;
