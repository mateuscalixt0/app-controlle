export function DemoNotice({ children = "Dados fictícios para validação da experiência." }: { children?: React.ReactNode }) {
  return (
    <p className="demo-notice" role="note">
      <strong>Protótipo:</strong> {children}
    </p>
  );
}
