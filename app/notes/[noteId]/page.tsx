export default function NotePage({
  params,
}: {
  params: { noteId: string };
}) {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Note {params.noteId}</h1>
      <p>Note content will be displayed here</p>
    </div>
  );
}
