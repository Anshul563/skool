export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* We will add a Sidebar/Navbar here later */}
      <main className="">{children}</main>
    </div>
  );
}