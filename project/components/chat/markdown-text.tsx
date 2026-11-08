import { useState, type ReactNode } from 'react';
import { ExternalLink, Film, Play, X, ZoomIn } from 'lucide-react';
import { CodeBlock } from '@/components/chat/code-block';

type MarkdownBlock =
  | { kind: 'code'; language: string; code: string }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'image'; alt: string; url: string }
  | { kind: 'video'; title: string; url: string }
  | { kind: 'paragraph'; text: string };

const FENCE = /^```\s*([\w+-]*)/;
const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const IMAGE_LINE = /^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/;
const VIDEO_LINE = /^\[Assistir:\s*(.*?)\]\((https?:\/\/[^\s)]+)\)$/i;

function listItem(line: string): { ordered: boolean; text: string } | null {
  const numbered = NUMBERED.exec(line);
  if (numbered) return { ordered: true, text: numbered[1] };
  const bullet = BULLET.exec(line);
  if (bullet) return { ordered: false, text: bullet[1] };
  return null;
}

function startsBlock(line: string): boolean {
  const trimmed = line.trim();
  return (
    !trimmed ||
    FENCE.test(line) ||
    HEADING.test(line) ||
    listItem(line) !== null ||
    IMAGE_LINE.test(trimmed) ||
    VIDEO_LINE.test(trimmed)
  );
}

function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    const fence = FENCE.exec(line);
    const heading = HEADING.exec(line);
    const first = listItem(line);
    const imgMatch = IMAGE_LINE.exec(trimmed);
    const vidMatch = VIDEO_LINE.exec(trimmed);

    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push({ kind: 'code', language: fence[1], code: code.join('\n') });
    } else if (imgMatch) {
      blocks.push({ kind: 'image', alt: imgMatch[1], url: imgMatch[2] });
      index += 1;
    } else if (vidMatch) {
      blocks.push({ kind: 'video', title: vidMatch[1], url: vidMatch[2] });
      index += 1;
    } else if (heading) {
      blocks.push({ kind: 'heading', text: heading[2] });
      index += 1;
    } else if (first) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = listItem(lines[index]);
        if (!item || item.ordered !== first.ordered) break;
        items.push(item.text);
        index += 1;
      }
      blocks.push({ kind: 'list', ordered: first.ordered, items });
    } else if (!trimmed) {
      index += 1;
    } else {
      const paragraph: string[] = [];
      while (index < lines.length && !startsBlock(lines[index])) {
        paragraph.push(lines[index]);
        index += 1;
      }
      blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
    }
  }

  return blocks;
}

function renderInline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={index} className="rounded bg-[#1F1F1F] px-1.5 py-0.5 font-mono text-xs text-[#E5E5E5]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = /^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/.exec(part);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[#60A5FA] underline hover:text-white"
        >
          <span>{linkMatch[1]}</span>
          <ExternalLink className="h-3 w-3 inline" />
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function ChatImageBlock({ alt, url }: { alt: string; url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group relative my-2.5 aspect-video w-full max-w-md cursor-pointer overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] shadow-md transition-all hover:border-[#2563EB]"
      >
        <img
          src={url}
          alt={alt || 'Imagem'}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-2 text-left">
          <p className="truncate text-xs font-medium text-white">{alt || 'Registro fotográfico'}</p>
        </div>
        <div className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn className="h-3.5 w-3.5" />
        </div>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl border border-[#1F1F1F] bg-[#0A0A0A] p-2"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white hover:bg-[#2563EB]"
            >
              <X className="h-4 w-4" />
            </button>
            <img src={url} alt={alt} className="max-h-[75vh] w-full rounded-xl object-contain" />
            <p className="mt-2 text-center text-xs font-semibold text-white">{alt}</p>
          </div>
        </div>
      )}
    </>
  );
}

function ChatVideoBlock({ title, url }: { title: string; url: string }) {
  const [playing, setPlaying] = useState(false);
  const isDirect = url.endsWith('.webm') || url.endsWith('.mp4');

  if (playing) {
    return (
      <div className="my-2 aspect-video w-full max-w-md overflow-hidden rounded-xl border border-[#2563EB] bg-black">
        {isDirect ? (
          <video controls autoPlay className="h-full w-full" src={url} />
        ) : (
          <iframe src={url} title={title} allowFullScreen className="h-full w-full border-none" />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => setPlaying(true)}
      className="group my-2 flex max-w-md cursor-pointer items-center justify-between rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-3 transition-colors hover:border-[#2563EB]"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]/20 text-[#60A5FA]">
          <Film className="h-4 w-4" />
        </div>
        <div>
          <h5 className="text-xs font-semibold text-white">{title || 'Assistir vídeo'}</h5>
          <p className="text-[10px] text-[#A3A3A3]">Clique para reproduzir inline</p>
        </div>
      </div>
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-white transition-transform group-hover:scale-110">
        <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
      </div>
    </div>
  );
}

function renderBlock(block: MarkdownBlock, index: number): ReactNode {
  if (block.kind === 'code') {
    return <CodeBlock key={index} code={block.code} language={block.language} />;
  }
  if (block.kind === 'image') {
    return <ChatImageBlock key={index} alt={block.alt} url={block.url} />;
  }
  if (block.kind === 'video') {
    return <ChatVideoBlock key={index} title={block.title} url={block.url} />;
  }
  if (block.kind === 'heading') {
    return (
      <p key={index} className="pt-2 text-sm font-bold text-white">
        {renderInline(block.text)}
      </p>
    );
  }
  if (block.kind === 'list') {
    const ListTag = block.ordered ? 'ol' : 'ul';
    return (
      <ListTag key={index} className={`${block.ordered ? 'list-decimal' : 'list-disc'} space-y-1 pl-5`}>
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderInline(item)}</li>
        ))}
      </ListTag>
    );
  }
  return <p key={index}>{renderInline(block.text)}</p>;
}

export function MarkdownText({ source }: { source: string }) {
  return (
    <div className="space-y-2.5 text-xs leading-relaxed text-[#E5E5E5]">
      {parseMarkdown(source).map(renderBlock)}
    </div>
  );
}
