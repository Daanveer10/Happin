export const metadata = {
  title: "Happin",
  description: "Hassle free Work.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

