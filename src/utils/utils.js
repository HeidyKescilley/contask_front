import { toast } from "react-toastify";

// Função para copiar texto para o clipboard sem formatação
export const copyToClipboard = (text) => {
  // Remove pontos, barras e traços do CNPJ
  const unformattedText = text.replace(/[.\-\/]/g, "");

  if (navigator.clipboard && window.isSecureContext) {
    // Usa o método moderno de copiar
    navigator.clipboard
      .writeText(unformattedText)
      .then(() => {
        toast.success("CNPJ copiado com sucesso!");
      })
      .catch((error) => {
        toast.error("Erro ao copiar o CNPJ.");
      });
  } else {
    // Método de fallback para navegadores antigos
    const textArea = document.createElement("textarea");
    textArea.value = unformattedText;
    textArea.style.position = "fixed"; // Esconde o textarea fora da tela
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      toast.success("CNPJ copiado com sucesso!");
    } catch (error) {
      toast.error("Erro ao copiar o CNPJ.");
    }
    document.body.removeChild(textArea);
  }
};

// Função para formatar o CNPJ
export const formatCNPJ = (cnpj) => {
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
};
