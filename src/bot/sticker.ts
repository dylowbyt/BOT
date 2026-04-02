import sharp from "sharp";
import { logger } from "../lib/logger.js";

interface MediaLike {
  mimetype: string;
  data: string;
  filename?: string;
}

export async function createStickerMedia(media: MediaLike): Promise<MediaLike | null> {
  try {
    const buffer = Buffer.from(media.data, "base64");

    const webpBuffer = await sharp(buffer)
      .resize(512, 512, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 80 })
      .toBuffer();

    return {
      mimetype: "image/webp",
      data: webpBuffer.toString("base64"),
      filename: "sticker.webp",
    };
  } catch (err) {
    logger.error({ err }, "Error creating sticker");
    return null;
  }
}
