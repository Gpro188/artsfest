import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Fallback configuration from environment or project defaults so uploads always succeed on Vercel
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "06eb852c186a79f6b46092785852f1b6";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "447606767b4703f1de9331c53d25bbd3";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "9cbd9d07148c482eee5e33b6cca0a01e483f7cce2cd8de69ee0c5e696547e770";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "artsfest-images";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-412ce4aca9c34fafb6b1941e10907e1e.r2.dev";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    const safeName = file.name ? file.name.replace(/[^a-zA-Z0-9.-]/g, "_") : "image.jpg";
    const filename = `${folder}/${Date.now()}_${safeName}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: file.type || "image/jpeg",
    });

    // Upload directly from the server to Cloudflare R2
    await s3Client.send(command);
    
    // Construct the final public URL where the file will be accessible
    const finalUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${filename}`;

    return NextResponse.json({
      success: true,
      finalUrl: finalUrl,
    });
  } catch (error: any) {
    console.error("Error uploading to R2:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}

