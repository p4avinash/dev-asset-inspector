type FloatingButtonProps = {
  onClick: () => void;
};

export function FloatingButton({ onClick }: FloatingButtonProps) {
  return (
    <button
      type="button"
      className="inspector-floating-button"
      onClick={onClick}
      aria-label="Open Dev Asset Inspector"
      title="Dev Asset Inspector"
    >
      <span className="inspector-floating-button-icon" aria-hidden="true">
        ◈
      </span>

      <span className="inspector-floating-button-label">Assets</span>
      <span className="inspector-floating-button-dot" aria-hidden="true" />
    </button>
  );
}
