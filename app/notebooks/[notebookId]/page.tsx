export default function NotebookPage({
  params,
}: {
  params: { notebookId: string };
}) {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Notebook {params.notebookId}</h1>
      <p>Notebook content will be displayed here</p>
    </div>
  );
}
