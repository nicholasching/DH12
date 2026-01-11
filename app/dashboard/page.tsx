"use client";

import { UserButton } from "@clerk/nextjs";
import { NotebookList } from "@/components/notebooks/NotebookList";
import { useState } from "react";
import { CreateNotebookModal } from "@/components/dashboard/CreateNotebookModal";
import { SharedNotesList } from "@/components/dashboard/SharedNotesList";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-black">DH12 Notes</h1>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <SharedNotesList />
        
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-black">Your Notebooks</h2>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            + New Notebook
          </Button>
        </div>

        <NotebookList />
      </main>

      <CreateNotebookModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
