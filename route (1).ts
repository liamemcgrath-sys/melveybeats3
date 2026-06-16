export const metadata = {
  title: "Melvey Beats",
  description: "Beat marketplace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          fontFamily: "Arial, sans-serif",
          background: "linear-gradient(135deg, #eef7ff 0%, #dbeafe 35%, #93c5fd 100%)",
          color: "#0f172a",
        }}
      >
        {children}
      </body>
    </html>
  );
}
