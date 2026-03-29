interface VCardData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website?: string;
  address?: string;
  photo?: string; // Base64 image
  cardUrl?: string; // Digital Card URL
}

export const generateVCard = (data: VCardData): string => {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${data.name}`,
    `N:;${data.name};;;`,
    `ORG:${data.company}`,
    `TITLE:${data.title}`,
    `TEL;TYPE=CELL:${data.phone}`,
    `EMAIL;TYPE=INTERNET:${data.email}`,
  ];

  if (data.website) vcard.push(`URL:${data.website}`);
  if (data.address) vcard.push(`ADR:;;${data.address};;;`);
  
  // 디지털 명함 URL 추가 (NOTE 필드에 삽입하여 가독성 확보)
  if (data.cardUrl) {
    vcard.push(`NOTE:디지털 명함 보기: ${data.cardUrl}`);
    // 일부 주소록 앱은 URL 필드를 여러 개 지원함
    vcard.push(`URL;TYPE=DIGITAL_CARD:${data.cardUrl}`);
  }

  // QR 코드 이미지 추가 (PHOTO 필드)
  if (data.photo) {
    // data.photo expected to be "data:image/png;base64,..."
    const base64Data = data.photo.split(',')[1];
    if (base64Data) {
      vcard.push(`PHOTO;TYPE=PNG;ENCODING=b:${base64Data}`);
    }
  }

  vcard.push('END:VCARD');
  return vcard.join('\n');
};

export const downloadVCard = (data: VCardData) => {
  const vcardContent = generateVCard(data);
  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${data.name}_contact.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
