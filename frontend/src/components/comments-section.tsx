"use client";

import { useState } from "react";
import {
  createComment,
  deleteComment,
  updateComment,
  type Comment,
} from "@/lib/api/articles";
import { formatDateTime } from "@/lib/date";
import { useAuthenticationStore } from "@/stores/authentication-store";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

type CommentsSectionProperties = {
  articleId: number;
  initialComments: Comment[];
};

const primaryCtaClassName =
  "mt-3 cursor-pointer rounded bg-stone-900 px-4 py-2 text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-300";
const secondaryCtaClassName =
  "cursor-pointer rounded px-3 py-2 text-amber-700 transition hover:bg-amber-50 hover:text-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 active:scale-95";

export function CommentsSection({ articleId, initialComments }: CommentsSectionProperties) {
  const isEnglish = usePathname().startsWith("/en");
  const accessToken = useAuthenticationStore((state) => state.accessToken);
  const user = useAuthenticationStore((state) => state.user);
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState("");

  async function submitComment() {
    if (!accessToken) return;

    const comment = await createComment(accessToken, articleId, content);
    if (!comment) {
      toast.error(isEnglish ? "Unable to publish the comment." : "Impossible de publier le commentaire.");
      return;
    }

    setComments((current) => [...current, comment]);
    setContent("");
    toast.success(isEnglish ? "Comment published." : "Commentaire publié.");
  }

  function startEditing(comment: Comment) {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  }

  async function saveComment(comment: Comment) {
    if (!accessToken) return;

    const updated = await updateComment(accessToken, articleId, comment.id, editedContent);
    if (!updated) {
      toast.error(isEnglish ? "Unable to update the comment." : "Impossible de modifier le commentaire.");
      return;
    }

    setComments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setEditingCommentId(null);
    toast.success(isEnglish ? "Comment updated." : "Commentaire modifié.");
  }

  async function removeComment(comment: Comment) {
    if (!accessToken || !window.confirm(isEnglish ? "Permanently delete this comment?" : "Supprimer définitivement ce commentaire ?")) return;

    if (!(await deleteComment(accessToken, articleId, comment.id))) {
      toast.error(isEnglish ? "Unable to delete the comment." : "Impossible de supprimer le commentaire.");
      return;
    }

    setComments((current) => current.filter((item) => item.id !== comment.id));
    toast.success(isEnglish ? "Comment deleted." : "Commentaire supprimé.");
  }

  return (
    <section className="mt-16 border-t border-stone-200 pt-10">
      <h2 className="text-2xl font-bold">{isEnglish ? "Comments" : "Commentaires"}</h2>

      {accessToken ? (
        <div className="mt-6">
          <label className="font-semibold" htmlFor="comment-content">{isEnglish ? "Add a comment" : "Ajouter un commentaire"}</label>
          <textarea
            className="mt-2 min-h-28 w-full rounded border border-stone-300 bg-white p-3 text-stone-900 placeholder:text-stone-500 focus:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200"
            id="comment-content"
            placeholder={isEnglish ? "Share your thoughts" : "Partagez votre avis"}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          <button className={primaryCtaClassName} disabled={!content.trim()} type="button" onClick={() => void submitComment()}>
            {isEnglish ? "Publish comment" : "Publier le commentaire"}
          </button>
        </div>
      ) : <p className="mt-6 text-stone-600">{isEnglish ? "Log in to add a comment." : "Connecte-toi pour ajouter un commentaire."}</p>}

      <div className="mt-6 space-y-4">
        {comments.map((comment) => {
          const canManageComment = user?.id === comment.author.id;
          const isEditing = editingCommentId === comment.id;

          return (
            <article className="rounded-xl border border-stone-200 bg-white p-5" key={comment.id}>
              <p className="font-semibold">{comment.author.email}</p>
              <p className="mt-1 text-sm text-stone-500">{isEnglish ? "On" : "Le"} {formatDateTime(comment.createdAt, isEnglish ? "en" : "fr")}</p>
              {isEditing ? (
                <>
                  <textarea
                    className="mt-3 min-h-28 w-full rounded border border-stone-300 bg-white p-3 text-stone-900 focus:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200"
                    value={editedContent}
                    onChange={(event) => setEditedContent(event.target.value)}
                  />
                  <div className="mt-3 flex gap-2">
                    <button className={primaryCtaClassName} disabled={!editedContent.trim()} type="button" onClick={() => void saveComment(comment)}>
                      {isEnglish ? "Save" : "Enregistrer"}
                    </button>
                    <button className={secondaryCtaClassName} type="button" onClick={() => setEditingCommentId(null)}>
                      {isEnglish ? "Cancel" : "Annuler"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 whitespace-pre-wrap text-stone-700">{comment.content}</p>
                  {canManageComment && (
                    <div className="mt-3 flex gap-2">
                      <button className={secondaryCtaClassName} type="button" onClick={() => startEditing(comment)}>{isEnglish ? "Edit" : "Modifier"}</button>
                      <button className={secondaryCtaClassName} type="button" onClick={() => void removeComment(comment)}>{isEnglish ? "Delete" : "Supprimer"}</button>
                    </div>
                  )}
                </>
              )}
            </article>
          );
        })}
        {comments.length === 0 && <p className="text-stone-600">{isEnglish ? "No comments yet." : "Aucun commentaire pour le moment."}</p>}
      </div>
    </section>
  );
}
