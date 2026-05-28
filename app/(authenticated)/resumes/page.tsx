import { redirect } from 'next/navigation';

export default async function ResumesPageRedirect() {
  redirect('/artifacts?tab=generated-resumes');
}
