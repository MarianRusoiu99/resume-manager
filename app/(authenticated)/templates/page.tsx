import { redirect } from 'next/navigation';

export default async function TemplatesPageRedirect() {
  redirect('/artifacts?tab=templates');
}
