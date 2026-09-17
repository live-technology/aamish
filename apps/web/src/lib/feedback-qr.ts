const POSTER_WIDTH = 1800;
const POSTER_HEIGHT = 2250;

function image(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const result = new Image();
    result.onload = () => resolve(result);
    result.onerror = () => reject(new Error("The Aamish logo could not be loaded."));
    result.src = url;
  });
}

function wrapText(context: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  // Character wrapping also handles long names without spaces and Bengali text.
  for (const character of Array.from(text)) {
    if (line && context.measureText(line + character).width > width) {
      const space = line.lastIndexOf(" ");
      if (space > line.length / 2) { lines.push(line.slice(0, space)); line = line.slice(space + 1) + character; }
      else { lines.push(line); line = character; }
    } else line += character;
  }
  if (line) lines.push(line);
  return lines;
}

export async function createFeedbackQrPoster(url: string, enterpriseName: string): Promise<Blob> {
  const [{ default: QRCode }, logo] = await Promise.all([import("qrcode"), image("/brand/amish-logo-01.png")]);
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, url, { errorCorrectionLevel: "Q", margin: 4, width: 1120, color: { dark: "#173E30", light: "#FFFFFF" } });
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH; canvas.height = POSTER_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image export is unavailable in this browser.");
  context.fillStyle = "#F8F5EE"; context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  context.strokeStyle = "#D8DED2"; context.lineWidth = 3;
  context.beginPath(); context.roundRect(48, 48, 1704, 2154, 40); context.stroke();
  const drawLogo = (centerX: number, centerY: number, width: number) => {
    const height = width * logo.naturalHeight / logo.naturalWidth;
    context.drawImage(logo, centerX - width / 2, centerY - height / 2, width, height);
  };
  context.textAlign = "center"; context.fillStyle = "#365444";
  let size = 46;
  let nameLines: string[];
  do {
    context.font = `600 ${size}px Arial, sans-serif`;
    nameLines = wrapText(context, enterpriseName, 1460);
    if (nameLines.length <= 3) break;
    size -= 2;
  } while (size > 18);
  nameLines.forEach((line, index) => context.fillText(line, 900, 240 + index * (size + 10)));
  context.fillStyle = "#173E30"; context.font = "96px Georgia, serif";
  context.fillText("Tell us how we did,", 900, 485);
  context.fillText("we’re listening", 900, 605);
  context.fillStyle = "#FFFFFF";
  context.beginPath(); context.roundRect(300, 715, 1200, 1200, 40); context.fill();
  context.imageSmoothingEnabled = false;
  context.drawImage(qr, 340, 755, 1120, 1120);
  // A compact logo badge, quartile error correction, and an intact quiet zone preserve scanability.
  context.fillStyle = "#FFFFFF";
  context.beginPath(); context.roundRect(785, 1243, 230, 144, 24); context.fill();
  context.strokeStyle = "#E7EAE3"; context.lineWidth = 2; context.stroke();
  context.imageSmoothingEnabled = true;
  drawLogo(900, 1315, 180);
  context.fillStyle = "#365444"; context.font = "46px Arial, sans-serif";
  context.fillText("Please scan the QR to", 900, 2040);
  context.fillText("submit your feedback.", 900, 2100);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("The QR image could not be created.")), "image/png"));
}
