// app/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { z } from "zod";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const documentSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .trim()
    .refine(v => v.length > 0, "Title cannot be only whitespace"),
  content: z.string()
    .min(1, "Content is required")
    .max(10000, "Content must be less than 10,000 characters")
    .trim()
    .refine(v => v.length > 0, "Content cannot be only whitespace"),
});

type FormErrors = {
  title?: string[];
  content?: string[];
};

export default function Home() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const documents = useQuery(api.documents.list);
  const createDocument = useMutation(api.documents.create);

  // Local optimistic UI state: temporary documents shown until the server mutation completes.
  const [optimisticDocs, setOptimisticDocs] = useState<Doc<"documents">[]>([]);

  // Optimistic update helper
    // Helper to trim input values before validation
    const sanitizeInput = (value: string) => value.trim();
  
    // Removed unused optimistic helper; use createDocument directly for submissions

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Trim values before validation
      const trimmedData = {
        title: sanitizeInput(title),
        content: sanitizeInput(content)
      };

      const result = documentSchema.safeParse(trimmedData);
      
      if (!result.success) {
        setErrors(result.error.flatten().fieldErrors);
        return;
      }

      // Add a temporary optimistic document so the UI updates immediately.
      const tempDoc: Doc<"documents"> = {
        _id: "temp" as Id<"documents">,
        _creationTime: Date.now(),
        title: trimmedData.title,
        content: trimmedData.content,
        createdAt: Date.now(),
      } as Doc<"documents">;

      setOptimisticDocs((s) => [...s, tempDoc]);

      await createDocument({ 
        title: trimmedData.title,
        content: trimmedData.content
      });

      // Remove optimistic placeholder after success
      setOptimisticDocs((s) => s.filter((d) => d._id !== "temp"));

      // Clear form only after successful submission
      setTitle("");
      setContent("");
      
      // Show success feedback (optional toast/notification here)
    } catch (error) {
      console.error("Failed to create document:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to create document. Please try again.";
      
      // Remove optimistic placeholder on error as well
      setOptimisticDocs((s) => s.filter((d) => d._id !== "temp"));

      setErrors({ 
        title: [errorMessage],
        content: ["Your changes weren't saved. Please check your connection and try again."]
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <div>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-blue-600 text-white rounded">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title"
            className={`w-full p-2 border rounded transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
          />
          {errors.title?.map((error) => (
            <p key={error} id="title-error" role="alert" className="text-sm text-red-500 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          ))}
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your document content here..."
            className={`w-full p-2 border rounded h-32 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.content ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.content)}
            aria-describedby={errors.content ? "content-error" : undefined}
          />
          {errors.content?.map((error) => (
            <p key={error} id="content-error" role="alert" className="text-sm text-red-500 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          ))}
          <p className="text-xs text-gray-500 mt-1">
            {content.length}/10,000 characters
          </p>
        </div>
        
        <button 
          type="submit"
          className={`
            w-full sm:w-auto px-4 py-2 text-white rounded transition-all
            ${isSubmitting 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }
            flex items-center justify-center
          `}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Document...
            </>
          ) : 'Add Document'}
        </button>
      </form>

      <div>
        <h2 className="text-xl font-semibold mb-2">Documents</h2>
        {(() => {
          if (documents === undefined) {
            return (
              <div className="flex items-center justify-center p-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                Loading documents...
              </div>
            );
          }

          if (documents.length === 0) {
            return (
              <div className="text-center py-8 text-gray-500">
                No documents yet. Create your first one above!
              </div>
            );
          }

          return (
            <ul className="space-y-2">
              {[...(documents || []), ...optimisticDocs].map((doc) => (
                <li 
                  key={doc._id} 
                  className={`p-4 border rounded ${
                    doc._id === "temp" ? "opacity-50 animate-pulse" : ""
                  }`}
                >
                  <h3 className="font-bold">{doc.title}</h3>
                  <p className="text-gray-600">{doc.content}</p>
                </li>
              ))}
            </ul>
          );
        })()}
      </div>
    </div>
  );
}