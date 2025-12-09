export const metadata = {
  title: "Happin",
  description: "Discover real experiences happening around you",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

