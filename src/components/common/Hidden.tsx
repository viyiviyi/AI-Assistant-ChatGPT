export const Hidden = ({
  hidden = false,
  children,
}: {
  hidden?: boolean;
  children?: React.ReactNode;
}) => {
  if (hidden) return <></>;
  return <>{children}</>;
};
