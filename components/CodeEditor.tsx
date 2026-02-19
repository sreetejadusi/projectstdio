"use client";

import Editor from "@monaco-editor/react";

type Props = {
  language: "python" | "java" | "c";
  value?: string;
  onChange?: (value: string | undefined) => void;
};

export default function CodeEditor({ language, value, onChange }: Props) {
  return (
    <Editor
      beforeMount={(monaco) => {
        monaco.editor.defineTheme("custom-dark", {
          base: "vs-dark",
          inherit: true,
          rules: [],
          colors: {
            "editor.background": "#0f172a",
          },
        });
      }}
      theme="custom-dark"
    />
  );
}
