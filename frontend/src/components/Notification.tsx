interface NotificationProps {
  errorMsg: string;
  readyStatus: string;
}

export default function Notification({
  errorMsg,
  readyStatus,
}: NotificationProps) {
  return (
    <>
      {errorMsg && <div className="error-banner">{errorMsg}</div>}
      {readyStatus && <div className="ready-banner">{readyStatus}</div>}
    </>
  );
}