export default async function NotebookPage({
  params,
}: {
  params: Promise<{ notebookId: string }>;
}) {
  const { notebookId } = await params;
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Notebook {notebookId}</h1>
      <p>Notebook content will be displayed here</p>
    </div>
  );
}
