import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"NutriTrack",description:"Track nutrition, meals, weight and progress."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
