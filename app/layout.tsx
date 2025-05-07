import "./global.css";
import React, { ReactNode } from 'react';

export const metadata = {
  title: "GolfGPT",
  description: "The place to go for all your PGA Tour questions."
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
export default RootLayout;