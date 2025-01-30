import './globals.css';

export const metadata = {
  title: "Karetní Hra",
  description: "Sbírejte karty a sestavte si svou kolekci",
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
} 