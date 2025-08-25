
"use client";
import * as React from "react";

type Props = React.PropsWithChildren<{ className?: string }>;

export default function PageContainer({ children, className }: Props) {
  // pb-24 ensures content never hides behind a mobile tab bar
  return (
    <div className={`w-full max-w-5xl mx-auto px-4 md:px-6 pb-24 ${className ?? ""}`}>
      {children}
    </div>
  );
}
