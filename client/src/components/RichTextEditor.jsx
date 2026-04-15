import { useEffect, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Button, Card, Input, Label } from './ui';

function ToolbarButton({ active, children, ...props }) {
  return (
    <button
      type="button"
      className={
        'px-2 py-1 text-xs font-semibold border border-slate-200 ' +
        (active ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 hover:bg-slate-50')
      }
      {...props}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  label,
  valueHtml,
  onChangeHtml,
  placeholder = 'Tulis di sini...',
  onUploadImage,
}) {
  const [imgUploading, setImgUploading] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');
  const [showLink, setShowLink] = useState(false);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
          class: 'text-violet-700 underline',
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: valueHtml || '',
    editorProps: {
      attributes: {
        class:
          'min-h-[140px] prose prose-slate max-w-none p-3 focus:outline-none',
        'data-placeholder': placeholder,
      },
      handlePaste(view, event) {
        try {
          const html = event?.clipboardData?.getData('text/html') || '';
          const text = event?.clipboardData?.getData('text/plain') || '';

          // If HTML from Word is present but list markup isn't usable, fall back to text parsing
          const looksLikeWordList = /MsoListParagraph|mso-list|<\s*o:p\s*>/i.test(html);

          // Prefer default paste if we have decent HTML and it already has lists
          if (!looksLikeWordList && /<\s*(ul|ol|li)\b/i.test(html)) {
            return false;
          }

          const lines = String(text || '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);

          if (lines.length < 2) return false;

          const bulletRe = /^(?:[•\-–—\*]|\u2022)\s+/;
          const orderedRe = /^\d+[\.|\)]\s+/;

          const bulletCount = lines.filter((l) => bulletRe.test(l)).length;
          const orderedCount = lines.filter((l) => orderedRe.test(l)).length;

          if (bulletCount < 2 && orderedCount < 2) return false;

          event.preventDefault();

          const escapeHtml = (s) =>
            String(s)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');

          if (orderedCount >= bulletCount) {
            const itemTexts = lines
              .filter((l) => orderedRe.test(l))
              .map((l) => l.replace(orderedRe, '').trim())
              .filter(Boolean);

            if (itemTexts.length) {
              const { schema, tr } = view.state;
              const li = schema.nodes.listItem;
              const p = schema.nodes.paragraph;
              const ol = schema.nodes.orderedList;
              if (li && p && ol) {
                const listItems = itemTexts.map((t) => li.createAndFill(null, p.create(null, schema.text(t))));
                const node = ol.createAndFill({ order: 1 }, listItems.filter(Boolean));
                if (node) {
                  view.dispatch(tr.replaceSelectionWith(node).scrollIntoView());
                  return true;
                }
              }
            }
          }

          const itemTexts = lines
            .filter((l) => bulletRe.test(l))
            .map((l) => l.replace(bulletRe, '').trim())
            .filter(Boolean);

          if (itemTexts.length) {
            const { schema, tr } = view.state;
            const li = schema.nodes.listItem;
            const p = schema.nodes.paragraph;
            const ul = schema.nodes.bulletList;
            if (li && p && ul) {
              const listItems = itemTexts.map((t) => li.createAndFill(null, p.create(null, schema.text(t))));
              const node = ul.createAndFill(null, listItems.filter(Boolean));
              if (node) {
                view.dispatch(tr.replaceSelectionWith(node).scrollIntoView());
                return true;
              }
            }
          }

          return false;
        } catch {
          return false;
        }
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChangeHtml?.(html === '<p></p>' ? '' : html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = valueHtml || '';
    if (current !== incoming) editor.commands.setContent(incoming, false);
  }, [editor, valueHtml]);

  if (!editor) return null;

  return (
    <div>
      {label ? <Label>{label}</Label> : null}

      <Card className="mt-2">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2">
          <ToolbarButton
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            Bold
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            Italic
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            Underline
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            Bullets
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            Numbering
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </ToolbarButton>

          <div className="mx-1 h-6 w-px bg-slate-200" />

          <ToolbarButton
            active={editor.isActive('link')}
            onClick={() => {
              const prev = editor.getAttributes('link')?.href || '';
              setLinkDraft(prev);
              setShowLink((s) => !s);
            }}
          >
            Link
          </ToolbarButton>

          <label className="inline-flex items-center gap-2">
            <span
              className={
                'px-2 py-1 text-xs font-semibold border border-slate-200 ' +
                (imgUploading ? 'bg-slate-200 text-slate-700' : 'bg-white text-slate-900 hover:bg-slate-50')
              }
            >
              {imgUploading ? 'Uploading...' : 'Gambar'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={imgUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImgUploading(true);
                try {
                  if (!onUploadImage) throw new Error('Upload handler not provided');
                  const url = await onUploadImage(file);
                  editor.chain().focus().setImage({ src: url }).run();
                } finally {
                  setImgUploading(false);
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>

        {showLink ? (
          <div className="grid gap-2 border-b border-slate-200 p-3 sm:grid-cols-[1fr_auto_auto]">
            <Input value={linkDraft} onChange={(e) => setLinkDraft(e.target.value)} placeholder="https://..." />
            <Button
              variant="outline"
              onClick={() => {
                if (!linkDraft.trim()) {
                  editor.chain().focus().unsetLink().run();
                  setShowLink(false);
                  return;
                }
                editor.chain().focus().setLink({ href: linkDraft.trim() }).run();
                setShowLink(false);
              }}
            >
              Simpan
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setShowLink(false);
              }}
            >
              Hapus
            </Button>
          </div>
        ) : null}

        <EditorContent editor={editor} />
      </Card>
    </div>
  );
}
