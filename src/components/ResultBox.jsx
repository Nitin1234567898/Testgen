import React, { useEffect, useState } from "react";
import prettier from "prettier/standalone";
import prettierPluginJava from "prettier-plugin-java";

const ResultBox = ({ steps, code }) => {
  const [formattedCode, setFormattedCode] = useState("");
  const [copyStatus, setCopyStatus] = useState("Copy");
  const [downloadStatus, setDownloadStatus] = useState("Download");
  const [isFormatting, setIsFormatting] = useState(false);

  // 🧠 Supabase function URL
  const SUPABASE_FUNCTION_URL =
    "https://bfmlmpbrwlzpcmcmplgy.supabase.co/functions/v1/format-java";

  // 🧩 Debug info for Prettier (safe to keep)
  useEffect(() => {
    try {
      console.log("✅ Prettier Support Info:", prettier.getSupportInfo());
    } catch (err) {
      console.warn("⚠️ Could not retrieve Prettier support info:", err);
    }
  }, []);

  // 🧠 Format the generated Java code (local first, backend fallback)
  useEffect(() => {
    if (!code) return;

    const formatCode = async () => {
      setIsFormatting(true);

      try {
        // Decode the escaped newlines/tabs
        const decoded = code
          ?.replace(/\\n/g, "\n")
          .replace(/\\t/g, "    ")
          .replace(/\\"/g, '"')
          .trim();

        // 🔹 Try local Prettier formatting
        const pretty = await prettier.format(decoded, {
          parser: "java",
          plugins: [prettierPluginJava],
        });

        setFormattedCode(pretty);
      } catch (err) {
        console.warn("⚠️ Local Prettier failed, using Supabase backend...", err);

        try {
          // 🔹 Fallback to Supabase backend formatter
          const response = await fetch(SUPABASE_FUNCTION_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });

          const data = await response.json();

          if (response.ok && data.formatted) {
            console.log("✅ Received formatted code from Supabase");
            setFormattedCode(data.formatted);
          } else {
            console.error("❌ Backend formatting failed:", data.error);
            // Minimal readable fallback
            const fallback = code
              ?.replace(/\\n/g, "\n")
              .replace(/\\t/g, "    ")
              .replace(/\\"/g, '"')
              .replace(/;/g, ";\n")
              .replace(/\{/g, "{\n")
              .replace(/\}/g, "\n}\n")
              .trim();
            setFormattedCode(fallback);
          }
        } catch (backendErr) {
          console.error("❌ Could not reach Supabase formatter:", backendErr);

          // Final fallback
          const fallback = code
            ?.replace(/\\n/g, "\n")
            .replace(/\\t/g, "    ")
            .replace(/\\"/g, '"')
            .replace(/;/g, ";\n")
            .replace(/\{/g, "{\n")
            .replace(/\}/g, "\n}\n")
            .trim();
          setFormattedCode(fallback);
        }
      } finally {
        setIsFormatting(false);
      }
    };

    formatCode();
  }, [code]);

  // ✅ Copy with animation
  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedCode);
    setCopyStatus("Copied!");
    setTimeout(() => setCopyStatus("Copy"), 1500);
  };

  // ✅ Download with animation
  const handleDownload = () => {
    const blob = new Blob([formattedCode], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "LoginTest.java";
    link.click();
    setDownloadStatus("Saved!");
    setTimeout(() => setDownloadStatus("Download"), 1500);
  };

  return (
    <div className="animate-slide-up space-y-6">
      {/* Steps Section */}
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="w-2 h-2 bg-accent-blue rounded-full mr-3"></span>
          Test Steps
        </h3>
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-accent-blue text-white text-sm font-medium rounded-full flex items-center justify-center">
                {index + 1}
              </span>
              <span className="text-gray-300 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Code Section */}
      <div className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden">
        <div className="bg-dark-border px-4 py-2 border-b border-dark-border flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-400 text-sm ml-3">LoginTest.java</span>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleCopy}
              className={`text-xs px-3 py-1.5 rounded-md border border-accent-blue transition-all duration-200 ${
                copyStatus === "Copied!"
                  ? "bg-accent-blue text-white scale-105"
                  : "text-accent-blue hover:bg-accent-blue hover:text-white hover:scale-105"
              }`}
            >
              {copyStatus}
            </button>

            <button
              onClick={handleDownload}
              className={`text-xs px-3 py-1.5 rounded-md border border-gray-500 transition-all duration-200 ${
                downloadStatus === "Saved!"
                  ? "bg-green-600 text-white scale-105"
                  : "text-gray-300 hover:bg-green-600 hover:text-white hover:scale-105"
              }`}
            >
              {downloadStatus}
            </button>
          </div>
        </div>

        <pre className="p-6 overflow-x-auto whitespace-pre text-gray-300 font-mono text-sm leading-relaxed">
          {isFormatting
            ? "// Formatting code..."
            : formattedCode || "// No code generated yet"}
        </pre>
      </div>
    </div>
  );
};

export default ResultBox;
