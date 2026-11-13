import './globals.css';

export const metadata = {
  title: 'Skill For Hire | Your skills, your opportunities',
  description: 'A campus talent platform for student profiles, skills and portfolios.',
  icons: { icon: '/icon.svg' },
  themeColor: '#0F8F83'
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
