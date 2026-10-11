export async function validateBillFile(file: File) {
  if (!file.name.trim() || file.name.length > 255) throw new Error('Use um nome de arquivo de até 255 caracteres.');
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('Selecione um arquivo de até 10 MB, não vazio.');
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const pdf = bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  if (!(file.type === 'application/pdf' && pdf || file.type === 'image/jpeg' && jpeg || file.type === 'image/png' && png)) throw new Error('Envie um PDF, JPG ou PNG válido.');
}

