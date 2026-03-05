// vCard 생성 유틸리티
export interface VCardData {
  name: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  photo?: string;
}

export function generateVCard(data: VCardData): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${data.name}`,
    `N:${data.name};;;`,
  ];

  if (data.title) {
    lines.push(`TITLE:${data.title}`);
  }

  if (data.company) {
    lines.push(`ORG:${data.company}`);
  }

  if (data.phone) {
    lines.push(`TEL;TYPE=CELL:${data.phone}`);
  }

  if (data.email) {
    lines.push(`EMAIL:${data.email}`);
  }

  if (data.website) {
    lines.push(`URL:${data.website}`);
  }

  if (data.address) {
    lines.push(`ADR:;;${data.address};;;;`);
  }

  if (data.photo) {
    lines.push(`PHOTO;TYPE=JPEG:${data.photo}`);
  }

  lines.push('END:VCARD');

  return lines.join('\r\n');
}

export function downloadVCard(data: VCardData): void {
  const vcard = generateVCard(data);
  const blob = new Blob([vcard], { type: 'text/vcard' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.name.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
