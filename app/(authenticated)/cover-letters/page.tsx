import { redirect } from 'next/navigation';

export default async function CoverLettersPageRedirect() {
  redirect('/artifacts?tab=cover-letters');
}
