"use client";

import { useEffect, useRef } from "react";
import Editor, { OnMount, BeforeMount } from "@monaco-editor/react";
import type * as MonacoEditor from "monaco-editor";
import { useTheme } from "@/components/providers/ThemeProvider";

const LANGUAGE_MAP: Record<string, string> = {
  python: "python",
  java: "java",
  c: "c",
};

type Props = {
  language: "python" | "java" | "c";
  value: string;
  onChange: (value: string) => void;
  fontSize?: number;
  readOnly?: boolean;
  onKeystroke?: (timestamp: number) => void;
  onPasteAttempt?: () => void;
  onContentChange?: (length: number) => void;
};

export function MonacoCodeEditor({
  language,
  value,
  onChange,
  fontSize = 13,
  readOnly = false,
  onKeystroke,
  onPasteAttempt,
  onContentChange,
}: Props) {
  const { theme } = useTheme();
  const rootRef = useRef<HTMLElement | null>(null);
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("frogmatrix-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "5f7a67", fontStyle: "italic" },
        { token: "keyword", foreground: "166534", fontStyle: "bold" },
        { token: "number", foreground: "0f766e" },
        { token: "string", foreground: "15803d" },
        { token: "type.identifier", foreground: "14532d" },
      ],
      colors: {
        "editor.background": "#F7FCF8",
        "editor.foreground": "#122118",
        "editorLineNumber.foreground": "#7A8F81",
        "editorLineNumber.activeForeground": "#14532D",
        "editorCursor.foreground": "#166534",
        "editor.selectionBackground": "#D9F99D66",
        "editor.inactiveSelectionBackground": "#DCFCE766",
        "editor.lineHighlightBackground": "#ECFDF333",
        "editorIndentGuide.background1": "#D7E9DA",
        "editorIndentGuide.activeBackground1": "#A7CBAE",
      },
    });

    monaco.editor.defineTheme("frogmatrix-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6b8f73", fontStyle: "italic" },
        { token: "keyword", foreground: "4ADE80", fontStyle: "bold" },
        { token: "number", foreground: "5EEAD4" },
        { token: "string", foreground: "86EFAC" },
        { token: "type.identifier", foreground: "D1FAE5" },
      ],
      colors: {
        "editor.background": "#111111",
        "editor.foreground": "#E5F3E8",
        "editorLineNumber.foreground": "#4B6354",
        "editorLineNumber.activeForeground": "#CFEED6",
        "editorCursor.foreground": "#4ADE80",
        "editor.selectionBackground": "#14532D99",
        "editor.inactiveSelectionBackground": "#14532D55",
        "editor.lineHighlightBackground": "#1A2A1E",
        "editorIndentGuide.background1": "#223528",
        "editorIndentGuide.activeBackground1": "#355E3B",
      },
    });
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.updateOptions({
      fontSize,
      readOnly,
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
      editorRef.current = null;
      if (rootRef.current) {
        rootRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    editorRef.current?.updateOptions({ fontSize, readOnly });
  }, [fontSize, readOnly]);

  return (
    <div className="editor-shell h-full bg-[#f7fcf8] dark:bg-[#111111]">
      <Editor
        height="100%"
        defaultLanguage={LANGUAGE_MAP[language]}
        language={LANGUAGE_MAP[language]}
        theme={theme === "dark" ? "frogmatrix-dark" : "frogmatrix-light"}
        value={value}
        onChange={(next) => onChange(next ?? "")}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={{
          readOnly,
          wordWrap: "off",
          fontFamily: "var(--font-mono)",
          padding: { top: 18, bottom: 18 },
        }}
      />
    </div>
  );
}
