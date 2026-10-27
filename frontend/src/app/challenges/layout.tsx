import SessionKeeper from '@/src/components/SessionKeeper';

export default function ChallengesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionKeeper />
      {children}
    </>
  );
}