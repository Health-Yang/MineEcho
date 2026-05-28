import { memo, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import type { Components } from "react-markdown";

let mermaidLoader: Promise<typeof import("mermaid").default> | null = null;

function loadMermaid() {
  mermaidLoader ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "strict",
      suppressErrorRendering: true,
    });
    mermaid.parseError = () => {};
    return mermaid;
  });
  return mermaidLoader;
}

function cleanupMermaidErrorArtifacts() {
  if (typeof document === "undefined") return;
  document
    .querySelectorAll(".mermaid-error, .error-icon, .error-text, .edge-thickness-normal, .cluster rect[style*='fill:#552222']")
    .forEach((node) => {
      const element = node instanceof HTMLElement ? node : node.parentElement;
      element?.remove();
    });
}

function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="code-copy-btn"
      title={copied ? "已复制" : "复制代码"}
    >
      {copied ? <CheckOutlined style={{ fontSize: 12 }} /> : <CopyOutlined style={{ fontSize: 12 }} />}
    </button>
  );
}

const MermaidDiagram = memo(function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    setError(false);
    loadMermaid()
      .then(async (mermaid) => {
        await mermaid.parse(code);
        return mermaid.render(idRef.current, code);
      })
      .then(({ svg }) => {
        if (!cancelled) setSvg(svg);
      })
      .catch(() => {
        cleanupMermaidErrorArtifacts();
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      cleanupMermaidErrorArtifacts();
    };
  }, [code]);

  if (error) {
    return (
      <div className="code-block-wrapper">
        <div style={{ padding: "8px 12px", fontSize: 12, color: "#8c8c8c", borderBottom: "1px solid #e8e8e8" }}>
          Mermaid 图表语法无法渲染，已按代码显示
        </div>
        <CodeCopyButton code={code} />
        <pre className="code-block">
          <code className="language-mermaid">{code}</code>
        </pre>
      </div>
    );
  }
  if (!svg) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: "center",
          color: "#999",
          background: "#f8f9fa",
          borderRadius: 8,
          margin: "8px 0",
        }}
      >
        图表渲染中...
      </div>
    );
  }
  return (
    <div
      className="mermaid-diagram"
      style={{ margin: "8px 0", overflow: "auto" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});

function extractCodeText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractCodeText).join("");
  if (node && typeof node === "object" && "props" in node) {
    const propsNode = node as { props?: { children?: unknown } };
    if (propsNode.props?.children) {
      return extractCodeText(propsNode.props.children);
    }
  }
  return "";
}

interface MarkdownMessageRendererProps {
  content: string;
  isUser: boolean;
  showCursor?: boolean;
}

export const MarkdownMessageRenderer = memo(function MarkdownMessageRenderer({
  content,
  isUser,
  showCursor,
}: MarkdownMessageRendererProps) {
  const remarkPlugins = useMemo(() => [remarkGfm], []);

  const components = useMemo<Components>(() => {
    const userColor = "#fff";
    const assistantColor = "#0066ff";
    const linkColor = isUser ? userColor : assistantColor;
    const borderColor = isUser ? "rgba(255,255,255,0.2)" : "#e8e8e8";
    const bgColor = isUser ? "rgba(255,255,255,0.1)" : "#f8f9fa";
    const theadBgColor = isUser ? "rgba(255,255,255,0.15)" : "#f8f9fa";
    const blockquoteBorderColor = isUser ? "rgba(255,255,255,0.4)" : "#d9d9d9";
    const inlineCodeBg = isUser ? "rgba(255,255,255,0.2)" : "#f1f5f9";

    return {
      p: ({ children }) => <p style={{ margin: "0 0 10px", lineHeight: 1.7 }}>{children}</p>,
      ul: ({ children }) => <ul style={{ margin: "0 0 10px", paddingLeft: 20, lineHeight: 1.7 }}>{children}</ul>,
      ol: ({ children }) => <ol style={{ margin: "0 0 10px", paddingLeft: 20, lineHeight: 1.7 }}>{children}</ol>,
      li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
      pre: ({ children }) => {
        const codeText = extractCodeText(children);
        return (
          <div className="code-block-wrapper">
            <CodeCopyButton code={codeText} />
            <pre className="code-block">{children}</pre>
          </div>
        );
      },
      code: ({ className, children }) => {
        const isInline = !className;
        const lang = className?.replace("language-", "") || "";

        if (lang === "mermaid" && !isInline) {
          const codeText = extractCodeText(children);
          return <MermaidDiagram code={codeText} />;
        }

        const codeStyle = isInline
          ? {
              background: inlineCodeBg,
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: "0.9em",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }
          : {
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "0.9em",
            };
        return (
          <code className={className} style={codeStyle}>
            {children}
          </code>
        );
      },
      a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link" style={{ color: linkColor }}>
          {children}
        </a>
      ),
      h1: ({ children }) => <h1 style={{ margin: "16px 0 12px", fontSize: "1.4em", fontWeight: 600 }}>{children}</h1>,
      h2: ({ children }) => <h2 style={{ margin: "14px 0 10px", fontSize: "1.25em", fontWeight: 600 }}>{children}</h2>,
      h3: ({ children }) => <h3 style={{ margin: "12px 0 8px", fontSize: "1.1em", fontWeight: 600 }}>{children}</h3>,
      blockquote: ({ children }) => (
        <blockquote style={{ margin: "10px 0", padding: "8px 16px", borderLeft: `3px solid ${blockquoteBorderColor}`, background: bgColor, borderRadius: "0 8px 8px 0" }}>
          {children}
        </blockquote>
      ),
      hr: () => <hr style={{ margin: "16px 0", border: "none", borderTop: `1px solid ${borderColor}` }} />,
      table: ({ children }) => (
        <div style={{ overflow: "auto", margin: "10px 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.9em" }}>{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead style={{ background: theadBgColor }}>{children}</thead>,
      th: ({ children }) => (
        <th style={{ padding: "8px 12px", border: `1px solid ${borderColor}`, fontWeight: 600, textAlign: "left" }}>
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td style={{ padding: "8px 12px", border: `1px solid ${borderColor}` }}>
          {children}
        </td>
      ),
    };
  }, [isUser]);

  return (
    <div className="markdown-body" style={{ overflow: "auto", wordBreak: "break-word" }}>
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {content}
      </ReactMarkdown>
      {showCursor && (
        <>
          <span style={{ display: "inline-block", width: "2px", height: "1.2em", backgroundColor: "#0066ff", marginLeft: "2px", verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />
          <style>{`@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }`}</style>
        </>
      )}
    </div>
  );
});
