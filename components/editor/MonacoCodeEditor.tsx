"use client";

import { useEffect, useRef } from "react";
import Editor, { OnMount, BeforeMount } from "@monaco-editor/react";

const LANGUAGE_MAP: Record<string, string> = {
  python: "python",
  java: "java",
  c: "c",
};

type Props = {
  language: "python" | "java" | "c";
  value: string;
  onChange: (value: string) => void;
  onKeystroke?: (timestamp: number) => void;
  onPasteAttempt?: () => void;
  onContentChange?: (length: number) => void;
};

export function MonacoCodeEditor({
  language,
  value,
  onChange,
  onKeystroke,
  onPasteAttempt,
  onContentChange,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("studio-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0b1120",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#e2e8f0",
      },
    });
  };

  const handleMount: OnMount = (editor, monaco) => {
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
      tabSize: 2,
      contextmenu: false,
      dragAndDrop: false,
      cursorBlinking: "solid",
    });

    const domNode = editor.getDomNode();
    if (domNode) {
      const handlePaste = (event: ClipboardEvent) => {
        event.preventDefault();
        onPasteAttempt?.();
      };

      const handleDrop = (event: DragEvent) => {
        event.preventDefault();
      };

      const handleContextMenu = (event: MouseEvent) => {
        event.preventDefault();
      };

      domNode.addEventListener("paste", handlePaste);
      domNode.addEventListener("drop", handleDrop);
      domNode.addEventListener("contextmenu", handleContextMenu);

      rootRef.current = domNode;

      const cleanup = () => {
        domNode.removeEventListener("paste", handlePaste);
        domNode.removeEventListener("drop", handleDrop);
        domNode.removeEventListener("contextmenu", handleContextMenu);
      };

      editor.onDidDispose(cleanup);
    }

    editor.onKeyDown((e) => {
      onKeystroke?.(Date.now());

      const isPaste =
        (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV;
      const isShiftInsert =
        e.shiftKey && e.keyCode === monaco.KeyCode.Insert;

      if (isPaste || isShiftInsert) {
        e.preventDefault();
        onPasteAttempt?.();
      }
    });

    editor.onDidChangeModelContent(() => {
      const current = editor.getValue();
      onContentChange?.(current.length);
    });
  };

  useEffect(() => {
    return () => {
      if (rootRef.current) {
        rootRef.current = null;
      }
    };
  }, []);

  return (
    <div className="editor-shell">
      <Editor
        height="100%"
        defaultLanguage={LANGUAGE_MAP[language]}
        language={LANGUAGE_MAP[language]}
        theme="studio-dark"
        value={value}
        onChange={(next) => onChange(next ?? "")}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={{
          readOnly: false,
          wordWrap: "on",
          fontFamily: "var(--font-mono)",
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
}
