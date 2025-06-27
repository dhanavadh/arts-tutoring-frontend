import { QuizPage } from './QuizPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <QuizPage id={id} />;
}
