import React, { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Tag, Typography } from 'antd';
import type { Frontmatter, ParsedMarkdown } from '../../types/knowledge-base';

interface MarkdownPreviewProps {
  content: string;
  path: string;
  showFrontmatter?: boolean;
}

function parseFrontmatter(content: string): ParsedMarkdown {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, body: content };
  }

  const yaml = match[1];
  const body = match[2];

  const frontmatter: Frontmatter = {};
  yaml.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim();
      if (value.startsWith('[') && value.endsWith(']')) {
        frontmatter[key.trim()] = value
          .slice(1, -1)
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      } else {
        frontmatter[key.trim()] = value.replace(/^["'](.*)["']$/, '$1');
      }
    }
  });

  return { frontmatter, body };
}

function getTypeColor(type?: string): string {
  switch (type) {
    case 'concept':
      return 'blue';
    case 'entity':
      return 'green';
    case 'source':
      return 'orange';
    case 'comparison':
      return 'purple';
    case 'synthesis':
      return 'cyan';
    default:
      return 'default';
  }
}

function getTypeLabel(type?: string): string {
  switch (type) {
    case 'concept':
      return '概念';
    case 'entity':
      return '实体';
    case 'source':
      return '来源';
    case 'comparison':
      return '对比';
    case 'synthesis':
      return '综合';
    default:
      return '文档';
  }
}

const FrontmatterSection = memo(({ frontmatter }: { frontmatter: Frontmatter | null }) => {
  if (!frontmatter) return null;
  return (
    <div
      style={{
        marginBottom: 24,
        padding: 20,
        background: '#f6f8fa',
        borderRadius: 8,
        border: '1px solid #e1e4e8',
      }}
    >
      {frontmatter.title && (
        <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
          {frontmatter.title}
        </Typography.Title>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        {frontmatter.type && (
          <Tag color={getTypeColor(frontmatter.type)} style={{ fontSize: 13, padding: '4px 12px' }}>
            {getTypeLabel(frontmatter.type)}
          </Tag>
        )}

        {frontmatter.tags && frontmatter.tags.length > 0 && (
          <span>
            {frontmatter.tags.map((tag: string) => (
              <Tag key={tag} style={{ marginRight: 8 }}>
                {tag}
              </Tag>
            ))}
          </span>
        )}

        {frontmatter.updated && (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            更新于 {frontmatter.updated}
          </Typography.Text>
        )}
      </div>
    </div>
  );
});

const MarkdownBody = memo(({ body }: { body: string }) => (
  <div className="markdown-body" style={{ fontSize: 15, lineHeight: 1.8 }}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          return match ? (
            <pre
              style={{
                background: '#f6f8fa',
                padding: 16,
                borderRadius: 8,
                overflow: 'auto',
                fontSize: 14,
                lineHeight: 1.5,
                maxHeight: 400,
              }}
            >
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          ) : (
            <code
              className={className}
              style={{
                background: '#f6f8fa',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: '0.9em',
              }}
              {...props}
            >
              {children}
            </code>
          );
        },
        h1({ children }) {
          return (
            <h1 style={{ borderBottom: '2px solid #eaecef', paddingBottom: 8 }}>
              {children}
            </h1>
          );
        },
        h2({ children }) {
          return (
            <h2 style={{ borderBottom: '1px solid #eaecef', paddingBottom: 6 }}>
              {children}
            </h2>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote
              style={{
                borderLeft: '4px solid #dfe2e5',
                paddingLeft: 16,
                marginLeft: 0,
                color: '#6a737d',
              }}
            >
              {children}
            </blockquote>
          );
        },
      }}
    >
      {body}
    </ReactMarkdown>
  </div>
));

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = memo(({ content }) => {
  const { frontmatter, body } = useMemo(() => parseFrontmatter(content), [content]);

  return (
    <div className="markdown-preview" style={{ maxWidth: 900, margin: '0 auto', height: '100%', overflow: 'auto' }}>
      <FrontmatterSection frontmatter={frontmatter} />
      <MarkdownBody body={body} />
    </div>
  );
});
