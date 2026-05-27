import { redirect } from 'next/navigation';

/** Root "/" → ops dashboard */
export default function RootPage() {
  redirect('/ops/dashboard');
}
