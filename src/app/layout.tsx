import "./globals.css";
import type { Metadata } from "next";
import { AnalyticsClient } from "@/components/AnalyticsClient";
export const metadata:Metadata={title:"Melvey — Your next sound",description:"Independent melodic, trap, and R&B beats. Preview, choose your license, and keep your sound in one place.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<AnalyticsClient/></body></html>;}
