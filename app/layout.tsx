import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'ParcelPilot · Pittsburgh housing screening',description:'Source-linked parcel screening and housing proposal comparison for Pittsburgh.',icons:{icon:'/icon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
