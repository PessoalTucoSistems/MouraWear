import { useState } from "react";
import { useToast } from "../context/ToastContext";
import { uploadImage } from "../lib/image";

// Campo de imagem do admin: envia arquivo (vai para o banco) ou aceita URL.
export default function ImageField({ onAdd, label = "Adicionar foto" }: { onAdd: (url: string) => void; label?: string }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) onAdd(await uploadImage(file));
    } catch (e) {
      toast((e as Error).message || "Falha ao enviar imagem", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <label className={`btn btn-ghost !py-2 ${uploading ? "pointer-events-none opacity-50" : ""}`}>
        {uploading ? "Enviando..." : label}
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </label>
      <div className="flex min-w-48 flex-1 gap-2">
        <input className="input !py-2" placeholder="ou cole a URL da imagem" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button
          type="button"
          className="btn btn-ghost !py-2"
          onClick={() => {
            if (!url.trim()) return;
            onAdd(url.trim());
            setUrl("");
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
