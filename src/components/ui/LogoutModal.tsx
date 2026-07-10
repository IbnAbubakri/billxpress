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
