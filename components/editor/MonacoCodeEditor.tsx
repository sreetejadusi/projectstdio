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
  const rootRef = useRef<HTMLElement | null>(null);
  const handleBeforeMount: BeforeMount = () => {};

  const handleMount: OnMount = (editor, monaco) => {
    editor.updateOptions({
      fontSize: 13,
      lineHeight: 22,
      minimap: { enabled: false },
      scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
      tabSize: 2,
      contextmenu: false,
      dragAndDrop: false,
      cursorBlinking: "solid",
      glyphMargin: false,
      folding: false,
      renderLineHighlight: "line",
      roundedSelection: true,
      smoothScrolling: true,
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      automaticLayout: true,
    });

    const domNode = editor.getDomNode();
    if (domNode) {
      const handlePaste = (event: ClipboardEvent) => {
        // event.preventDefault();
        // onPasteAttempt?.();
      };

      const handleDrop = (event: DragEvent) => {
        // event.preventDefault();
      };

      const handleContextMenu = (event: MouseEvent) => {
        // event.preventDefault();
      };

      // domNode.addEventListener("paste", handlePaste);
      // domNode.addEventListener("drop", handleDrop);
      // domNode.addEventListener("contextmenu", handleContextMenu);

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
        // e.preventDefault();
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
    <div className="editor-shell h-full bg-[#111111]">
      <Editor
        height="100%"
        defaultLanguage={LANGUAGE_MAP[language]}
        language={LANGUAGE_MAP[language]}
        theme="vs-dark"
        value={value}
        onChange={(next) => onChange(next ?? "")}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={{
          readOnly: false,
          wordWrap: "off",
          fontFamily: "var(--font-mono)",
          padding: { top: 18, bottom: 18 },
        }}
      />
    </div>
  );
}
