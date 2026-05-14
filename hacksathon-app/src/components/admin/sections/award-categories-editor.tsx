"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface AwardCategoryRow {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

interface AwardCategoriesEditorProps {
  eventId: string;
  categories: AwardCategoryRow[];
  isLocked: boolean;
}

/**
 * Manage Hacky Awards categories.
 *
 * Editor model:
 *   - Each category renders read-only by default with Edit / Delete.
 *   - Edit flips to inline form; Save PATCHes the row.
 *   - "Add category" expands an inline new-row form at the bottom.
 *
 * Sort order is implicit (server returns ordered, editor preserves that
 * order). Reordering UI is deferred — organizers usually accept the
 * defaults.
 */
export function AwardCategoriesEditor({
  eventId,
  categories,
  isLocked,
}: AwardCategoriesEditorProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <Card id="awards">
      <CardHeader>
        <CardTitle className="text-base">Hacky Awards categories</CardTitle>
        <CardDescription>
          Voting categories shown to participants when you open voting.
          Defaults are seeded automatically — edit or remove what you don&apos;t
          want.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">
            No categories yet. Add one below.
          </p>
        )}

        {categories.map((cat) =>
          editingId === cat.id ? (
            <CategoryEditForm
              key={cat.id}
              category={cat}
              onCancel={() => setEditingId(null)}
              onSaved={() => {
                setEditingId(null);
                router.refresh();
              }}
            />
          ) : (
            <CategoryReadRow
              key={cat.id}
              category={cat}
              disabled={isLocked}
              onEdit={() => setEditingId(cat.id)}
              onDeleted={() => router.refresh()}
            />
          ),
        )}

        {adding ? (
          <CategoryNewForm
            eventId={eventId}
            onCancel={() => setAdding(false)}
            onSaved={() => {
              setAdding(false);
              router.refresh();
            }}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLocked}
            onClick={() => setAdding(true)}
          >
            <Plus className="mr-2 size-4" />
            Add category
          </Button>
        )}

        {isLocked && (
          <p className="text-xs text-muted-foreground">
            Event is locked — categories can&apos;t be changed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryReadRow({
  category,
  disabled,
  onEdit,
  onDeleted,
}: {
  category: AwardCategoryRow;
  disabled: boolean;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        `Delete the "${category.name}" category? Any votes in this category will be cleared.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/award-categories/${category.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't delete category.");
        return;
      }
      toast.success("Category removed.");
      onDeleted();
    });
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-md border bg-card p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{category.name}</p>
        {category.description && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {category.description}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={disabled || pending}
        >
          <Pencil className="size-3.5" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={disabled || pending}
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}

function CategoryEditForm({
  category,
  onCancel,
  onSaved,
}: {
  category: AwardCategoryRow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [pending, startTransition] = useTransition();

  function handleSave() {
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/award-categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't save category.");
        return;
      }
      toast.success("Category updated.");
      onSaved();
    });
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/40 p-3">
      <div className="space-y-1.5">
        <Label htmlFor={`cat-${category.id}-name`} className="text-xs">
          Name
        </Label>
        <Input
          id={`cat-${category.id}-name`}
          value={name}
          maxLength={80}
          disabled={pending}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label
          htmlFor={`cat-${category.id}-description`}
          className="text-xs"
        >
          Description
        </Label>
        <Textarea
          id={`cat-${category.id}-description`}
          value={description}
          maxLength={300}
          disabled={pending}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}
        >
          <X className="mr-1.5 size-3" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

function CategoryNewForm({
  eventId,
  onCancel,
  onSaved,
}: {
  eventId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSave() {
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/award-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't add category.");
        return;
      }
      toast.success("Category added.");
      onSaved();
    });
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/40 p-3">
      <div className="space-y-1.5">
        <Label htmlFor="cat-new-name" className="text-xs">
          Name
        </Label>
        <Input
          id="cat-new-name"
          value={name}
          maxLength={80}
          autoFocus
          disabled={pending}
          onChange={(e) => setName(e.target.value)}
          placeholder="Most Likely to Ship This Monday"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cat-new-description" className="text-xs">
          Description (optional)
        </Label>
        <Textarea
          id="cat-new-description"
          value={description}
          maxLength={300}
          disabled={pending}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Quick blurb shown under the category name when voters pick."
        />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={pending}>
          {pending ? "Adding…" : "Add category"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}
        >
          <X className="mr-1.5 size-3" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
