import Link from 'next/link';
export default function NotFound() {
  return <main className="grid min-h-screen place-items-center px-6"><div className="text-center"><p className="text-sm font-bold uppercase tracking-widest text-teal-600">404</p><h1 className="mt-3 text-3xl font-bold">Page not found</h1><Link className="mt-6 inline-block rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white" href="/">Return home</Link></div></main>;
}
